const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const { 
    users , 
    use_right, 
    use_types, 
    vm }        = require("./datas/env.config.js");
const { contracts_load }         = require("./contracts.js");
const urb                        = require("./use_rights_base.js");
const mb                         = require("./market_base.js");

/*
 * 各组件关系图
 *             
 * 使用权通证---
 *             |---算力资源---
 *                           |---收益权通证
 *                           |---算力单元---|
 *                                          |---算力类型----|
 *                                                          |---GPU
 *                                                          |---内存
 *
 */
async function run(types) {
    logger.debug(types);

    let user        = users.manager; 
    let signer      = user.signer; 
    let to          = await users.seller.signer.getAddress(); ; 
    let deadline    = Math.floor(((new Date()).getTime())/1000) + use_right.deadline ;
    let deadline_vm = Math.floor(((new Date()).getTime())/ 1000) + vm.deadline;

    let owners = [to, await users.beneficiary.signer.getAddress()];
    logger.debug("owners:" + owners.toString());
    for( let i in types) {
        let type = types[i];
        let cvmid = await urb.select_comp_vm_ids_of_owner(to, type);
        logger.debug(cvmid);
        //无可用算力资源，则先创建
        if (cvmid == null) {
            let cuid = await urb.select_comp_unit_ids_of_owner(to, type, 1);
            //无可用算力单元，创建算力单元
            if (cuid == null) {
                //创建算力单元
                cuid = await urb.new_token_id(type);
                await urb.mint_comp_unit(user, to, cuid, 1, type);
                await urb.wait_comp_unit_exists(cuid);
            }

            //创建算力资源
            cvmid = await urb.new_token_id(cuid);
            await urb.mint_comp_vm(user, to, cvmid, cuid, 1, deadline_vm);
            await urb.wait_comp_vm_exists(cvmid);
        }

        //创建使用权通证
        let token_id = await urb.new_token_id(cvmid);

        await urb.mint_use_right(signer, to, token_id, deadline, cvmid);
        await urb.wait_use_right_exists(token_id);

        let revenue_info = await mb.mint_revenue_or_load_revenue_by_use_right_id(signer, token_id, owners);
        let use_right_info = await urb.datas_from_use_right_id(token_id);

        logger.form("使用权通证及收益权通证信息", use_right_info.form, revenue_info.form);
        
    }
}
run(use_types)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });

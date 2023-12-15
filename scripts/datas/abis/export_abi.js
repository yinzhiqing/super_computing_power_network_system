const fs = require('fs');

const contracts = ["GPUToken", 'GPUStore'];
for(var i=0; i< contracts.length; i++)
{
    console.log("./build/contracts/"+ contracts[i]);
    const content = JSON.parse(fs.readFileSync('../build/contracts/'+ contracts[i] + '.json', 'utf8'));
    fs.writeFileSync('./' + contracts[i]+ '.abi',  JSON.stringify(content.abi))
}

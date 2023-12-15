//SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.2;

interface IGPUStore {
    //
    //  Events
    //
    event AddGPUTokenToStoreEvent(
        uint256 indexed gpuTokenId,
        uint256 price, // fee for each month
        address indexed provider,
        uint256 timestamp
    );

    event RemoveGPUTokenToStoreEvent(
        uint256 indexed gpuTokenId,
        address indexed owner,
        uint256 timestamp
    );

    event TradeOrder(
        uint256 tradeOrderId,
        uint256 indexed gpuTokenId,
        uint256 price,
        address indexed provider,
        address indexed buyer,
        uint256 timestamp
    );

    event AddRevenueTokenToStoreEvent(
        uint256 indexed gpuTokenId,
        uint256 price, // fee for each month
        address indexed provider,
        uint256 timestamp
    );

    event RemoveRevenueTokenFromStoreEvent(
        uint256 indexed gpuTokenId,
        address indexed owner,
        uint256 timestamp
    );

    event TradeRevenueTokenEvent(
        uint256 indexed revenueTokenId,
        uint256 price,
        address indexed provider,
        address indexed buyer,
        uint256 timestamp
    );

    event DistributeRevenueEvent(
        uint256 indexed revenueTokenId,
        uint256 value,
        address indexed awardee,
        uint256 timestamp
    );

    event ChargePerMonthEvent(
        uint256 indexed gpuTokenId,
        uint256 fee,
        address ChargedAccount,
        uint256 timestamp
    );

    //
    //  Functions
    //

    //
    //  Add a GPU token to Store for sale
    //
    function addGpuTokenToStore(uint256 gpuTokenId, uint256 price) external;

    // Remove GPU Token from store
    function removeGpuTokenFromStore(uint256 gpuTokenId) external;

    //
    //  Get ID list of GPU token for sale
    //
    function getGPUTokenForSaleIds() external view returns (uint256[] memory);

    //
    //  Trade GPU token by Store
    //
    function tradeGPUToken(uint256 gpuTokenId) external;

    //
    //  Get ID list of all order
    //
    function getOrderIds() external view returns (uint256[] memory);

    //
    //  Add revenue token to store for sale
    //
    function addRevenueTokenToStore(
        uint256 revenueTokenId,
        uint256 price
    ) external;

    //
    //  Remove revenue token from store
    //
    function removeRevenueTokenFromStore(uint256 revenueTokenId) external;

    //
    //  Get ID list of all Revenue tokens for sale
    //
    function getRevenueTokenForSaleIds()
        external
        view
        returns (uint256[] memory);
    
    //
    //  Trade a revenue token by store
    //
    function tradeRevenueToken(uint256 revenueTokenId) external;

    //
    // Distribute revenue to the owners who holds Revene Token
    //
    function distributeRevenues() external;

    //
    // Charge from owner accunts who holds GPU Token periodically
    // Note: if fails to charge, contract Store will revoke GPU Token from holder account. 
    //
    function chargePerMonth() external;
}

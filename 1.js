// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function burn(uint256 amount) external;
}

contract TIFFYClaim {
    address public owner;
    IERC20 public immutable tiffyToken;

    uint256 public FIXED_BNB_FEE = 0.40 ether;
    uint256 public BURN_PERCENT = 1; // 1%

    mapping(address => bool) public isFeeExempt;

    // Fee receivers
    address public treasury = 0xed9b43bED20B063ae0966C0AEC446bc755fB84bA; // Growth
    address public liquidity = 0x6a28ae01Ad12bC73D0c70E88D23CeEd6d6382D19;
    address public blessings = 0x8e8f465cC81b87efE6C58Efb1A03Ff10c32bBf2d;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _tiffyToken) {
        owner = msg.sender;
        tiffyToken = IERC20(_tiffyToken);

        // Exempt wallets from fees
        isFeeExempt[owner] = true;
        isFeeExempt[treasury] = true;
        isFeeExempt[liquidity] = true;
        isFeeExempt[blessings] = true;
        isFeeExempt[0xF27d595F962ed722F39889B23682B39F712B4Da8] = true; // Rewards address
    }

    function claim() external payable {
        if (!isFeeExempt[msg.sender]) {
            require(msg.value == FIXED_BNB_FEE, "Invalid BNB fee");
            _distributeFee();
        }

        uint256 burnAmount = (1 ether * BURN_PERCENT) / 100;
        uint256 sendAmount = 1 ether - burnAmount;

        tiffyToken.burn(burnAmount);
        require(tiffyToken.transfer(msg.sender, sendAmount), "Token transfer failed");
    }

    function _distributeFee() internal {
        uint256 total = msg.value;
        payable(treasury).transfer((total * 10) / 20);   // 0.20
        payable(liquidity).transfer((total * 5) / 20);   // 0.10
        payable(blessings).transfer((total * 5) / 20);   // 0.10
    }

    // Admin functions
    function updateFixedFee(uint256 newFee) external onlyOwner {
        require(newFee <= 0.01 ether, "Too high"); // safety limit
        FIXED_BNB_FEE = newFee;
    }

    function updateBurnPercent(uint256 newPercent) external onlyOwner {
        require(newPercent <= 10, "Too high");
        BURN_PERCENT = newPercent;
    }

    function updateWallets(
        address _treasury,
        address _liquidity,
        address _blessings
    ) external onlyOwner {
        treasury = _treasury;
        liquidity = _liquidity;
        blessings = _blessings;
    }

    function setFeeExempt(address wallet, bool exempt) external onlyOwner {
        isFeeExempt[wallet] = exempt;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    receive() external payable {}
}

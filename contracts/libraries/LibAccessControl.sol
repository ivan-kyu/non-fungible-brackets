// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
import "@openzeppelin/contracts/utils/Strings.sol";

library LibAccessControl {
    bytes32 constant STORAGE_POSITION =
        keccak256("diamond.standard.nfb.access.control.storage");

    struct RoleData {
        mapping(address => bool) members;
        bytes32 adminRole;
    }

    struct Storage {
        RoleData roleData;
        mapping(bytes32 => RoleData) _roles;
        bytes32 DEFAULT_ADMIN_ROLE;
    }

    function dstorage() internal pure returns (Storage storage ds) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    function defaultAdminRole() internal pure returns (bytes32) {
        return 0x00;
    }

    function updaterRole() internal pure returns (bytes32) {
        return keccak256("UPDATER_ROLE");
    }

    /**
     * @dev Modifier that checks that an account has a specific role. Reverts
     * with a standardized message including the required role.
     *
     * The format of the revert reason is given by the following regular expression:
     *
     *  /^AccessControl: account (0x[0-9a-f]{40}) is missing role (0x[0-9a-f]{64})$/
     *
     * _Available since v4.1._
     */
    function onlyRole(bytes32 role) internal view {
        _checkRole(role, msg.sender);
    }

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account)
        internal
        view
        returns (bool)
    {
        return dstorage()._roles[role].members[account];
    }

    /**
     * @dev Revert with a standard message if `account` is missing `role`.
     *
     * The format of the revert reason is given by the following regular expression:
     *
     *  /^AccessControl: account (0x[0-9a-f]{40}) is missing role (0x[0-9a-f]{64})$/
     */
    function _checkRole(bytes32 role, address account) internal view {
        if (!hasRole(role, account)) {
            revert(
                string(
                    abi.encodePacked(
                        "AccessControl: account ",
                        Strings.toHexString(uint160(account), 20),
                        " is missing role ",
                        Strings.toHexString(uint256(role), 32)
                    )
                )
            );
        }
    }

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) internal view returns (bytes32) {
        return dstorage()._roles[role].adminRole;
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function grantRole(bytes32 role, address account) internal {
        onlyRole(getRoleAdmin(role));
        _grantRole(role, account);
    }

    function grantUpdaterRole(address account) internal {
        onlyRole(defaultAdminRole());
        _grantRole(updaterRole(), account);
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function revokeRole(bytes32 role, address account) internal {
        onlyRole(getRoleAdmin(role));
        _revokeRole(role, account);
    }

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been revoked `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `account`.
     */
    function renounceRole(bytes32 role, address account) internal {
        require(
            account == msg.sender,
            "AccessControl: can only renounce roles for self"
        );

        _revokeRole(role, account);
    }

    function initAccessControl() internal {
        dstorage().DEFAULT_ADMIN_ROLE = defaultAdminRole();
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event. Note that unlike {grantRole}, this function doesn't perform any
     * checks on the calling account.
     *
     * [WARNING]
     * ====
     * This function should only be called from the constructor when setting
     * up the initial roles for the system.
     *
     * Using this function in any other way is effectively circumventing the admin
     * system imposed by {AccessControl}.
     * ====
     *
     * NOTE: This function is deprecated in favor of {_grantRole}.
     */

    function _setupRole(bytes32 role, address account) internal {
        _grantRole(role, account);
    }

    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal {
        dstorage()._roles[role].adminRole = adminRole;
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * Internal function without access restriction.
     */
    function _grantRole(bytes32 role, address account) internal {
        if (!hasRole(role, account)) {
            dstorage()._roles[role].members[account] = true;
        }
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     */
    function _revokeRole(bytes32 role, address account) internal {
        onlyRole(getRoleAdmin(role));
        if (hasRole(role, account)) {
            dstorage()._roles[role].members[account] = false;
        }
    }
}

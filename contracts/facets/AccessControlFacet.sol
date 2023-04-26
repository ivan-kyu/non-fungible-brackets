// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
import "@openzeppelin/contracts/utils/Strings.sol";
import {LibAccessControl} from "../libraries/LibAccessControl.sol";

import "../interfaces/IAccessControl.sol";

contract AccessControlFacet is IAccessControl {
    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) public view returns (bool) {
        return LibAccessControl.dstorage()._roles[role].members[account];
    }

    /**
     * @dev Gets the default 0x00 DEFAULT_ADMIN_ROLE.
     */
    function getDefaultAdmin() external pure returns (bytes32) {
        return LibAccessControl.defaultAdminRole();
    }

    /**
     * @dev Gets the UPDATER_ROLE.
     */
    function getUpdaterRole() external pure returns (bytes32) {
        return LibAccessControl.updaterRole();
    }

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) external view returns (bytes32) {
        return LibAccessControl.getRoleAdmin(role);
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
    function grantRole(bytes32 role, address account) external {
        LibAccessControl.grantRole(role, account);
        emit RoleGranted(role, account, msg.sender);
    }

    /**
     * @dev Grants `UPDATER_ROLE` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function grantUpdaterRole(address account) external {
        LibAccessControl.grantUpdaterRole(account);
        emit RoleGranted(LibAccessControl.updaterRole(), account, msg.sender);
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
    function revokeRole(bytes32 role, address account) external {
        LibAccessControl._revokeRole(role, account);
        emit RoleRevoked(role, account, msg.sender);
    }
}

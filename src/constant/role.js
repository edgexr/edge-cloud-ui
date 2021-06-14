import { PAGE_CLUSTER_INSTANCES, PAGE_APP_INSTANCES } from "../constant"

/**
 * 
 * @param {*} roles - show org api response
 * @param {*} selectedRole - org to be managed
 * @returns boolean
 */
export const validateRole = (roles, selectedRole) => {
    if (roles && selectedRole) {
        return roles.includes(selectedRole.role) || roles.includes(selectedRole.type)
    }
    return true
}
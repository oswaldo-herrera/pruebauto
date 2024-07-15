import axios from "axios";
import { ApiUrl } from '../../constants/api/site';
export const GroupPermissionEndpoint = "general/permission_groups"
export const PermissionEndpoint = "general/new_password_profile"

export class GroupPermission {
    constructor(data){
        this.id = data.id;
        this.name = data.name;
        this.permissions = data.permissions;
    }
}

export class Permission {
    constructor(id,name){
        this.id = id;
        this.name = name;
    }
}

export async function getAllGroupPermissions() {
    return await axios.get(`${ApiUrl}${GroupPermissionEndpoint}/`)
    .then((result) => {
        const results = result.data && typeof result.data !== "undefined" ? result.data : [];
        return results.map((item) =>{ return new GroupPermission(item)});
    });
}
  
export async function getGroupPermission(id) {
    return await axios.get(`${ApiUrl}${GroupPermissionEndpoint}/${id}/`).then(result => {
        return result.data
    });
}

export async function createGroupPermission(GroupPermissionData) {
    return await axios.post(`${ApiUrl}${GroupPermissionEndpoint}/`, GroupPermissionData).then(result => result.data);
}
  
export async function updateGroupPermission(id, GroupPermissionData) {
    return await axios.put(`${ApiUrl}${GroupPermissionEndpoint}/${id}/`, GroupPermissionData).then(result => result.data);
}

export async function deleteGroupPermission(id) {
    return await axios.delete(`${ApiUrl}${GroupPermissionEndpoint}/${id}/`).then(result => result.data);
}
  
export async function getAllPermissions(parameters) {
    return await axios.get(`${ApiUrl}${PermissionEndpoint}/`, { params: parameters })
    .then((result) => {
        const results = result.data && typeof result.data !== "undefined" ? result.data : [];
        return results.map((item) =>{ return new Permission(item)});
    });
}
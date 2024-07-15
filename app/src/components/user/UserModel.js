import axios from "axios";
import { ApiUrl } from '../../constants/api/site';
export const UserExtensionEndpoint = "general/extended_users"
export const DeactivateUserExtensionEndpoint = "general/deactivate_extended_user"
export const UserExtensionPasswordEndpoint = "general/new_password"
export const ProfilePasswordEndpoint = "general/new_password_profile"
export const UserGroupEndpoint = "general/user_groups"
export const ProfileEndpoint = "general/profile"
export const DeactivateProfileEndpoint = "general/new_password_profile"

export class Profile {
    constructor(data){
        this.id = data.id;
        this.user = new User(
            data.user.id,
            data.user.username,
            data.user.first_name,
            data.user.last_name,
            data.user.email,
            data.user.password,
            data.user.is_superuser,
            data.user.is_active);
        this.representative = data.representative;
        this.properties = data.properties;
        this.permissions = data.permissions;
    }

    has_vp_report_access(){
        return this.properties.find((property)=>property.code.includes("VP"))
    }

    has_op_report_access(){
        return this.properties.find((property)=>property.code.includes("OP"))
    }
}

export class UserExtension {
    constructor(data){
        this.id = data.id;
        this.user = data.user;
        this.representative = data.representative;
        this.provider = data.provider;
        this.permission_group = data.permission_group
        this.permission_group_name = data.permission_group_name
        this.properties = data.properties;
        this.verification_2fa = data.verification_2fa
        this.verification_2fa_method = data.verification_2fa_method
        this.phone = data.phone
    }

    has_vp_report_access(){
        return this.properties.find((property)=>property.code.includes("VP"))
    }

    has_op_report_access(){
        return this.properties.find((property)=>property.code.includes("OP"))
    }
}

export class User {
    constructor(id,username,first_name, last_name, email, password, is_superuser, is_active){
        this.id = id;
        this.username = username;
        this.first_name = first_name;
        this.last_name = last_name;
        this.email = email;
        this.password = password;
        this.is_superuser = is_superuser;
        this.is_active = is_active;
    }
}

export async function getAllUserExtensions(parameters) {
    return await axios.get(`${ApiUrl}${UserExtensionEndpoint}/`, { params: parameters })
    .then((result) => {
        const results = result.data.results && typeof result.data.results !== "undefined" ? result.data.results : [];
        return results.map((item) =>{ return new UserExtension(item)});
    });
}
  
export async function getUserExtension(id) {
    return await axios.get(`${ApiUrl}${UserExtensionEndpoint}/${id}/`).then(result => {
        result.data.properties = result.data.properties.map((property)=>property.id)
        return result.data
    });
}
  
export async function getProfile() {
    return await axios.get(`${ApiUrl}${ProfileEndpoint}/`).then(result => result.data);
}

export async function updateProfile(UserExtensionData) {
    return await axios.put(`${ApiUrl}${ProfileEndpoint}/`, UserExtensionData).then(result => result.data);
}

export async function newPasswordProfile(UserExtensionData) {
    return await axios.patch(`${ApiUrl}${ProfileEndpoint}/`, UserExtensionData).then(result => result.data);
}

export async function createUserExtension(UserExtensionData) {
    return await axios.post(`${ApiUrl}${UserExtensionEndpoint}/`, UserExtensionData).then(result => result.data);
}
  
export async function updateUserExtension(id, UserExtensionData) {
    return await axios.put(`${ApiUrl}${UserExtensionEndpoint}/${id}/`, UserExtensionData).then(result => result.data);
}

export async function deleteUserExtension(id) {
    return await axios.delete(`${ApiUrl}${UserExtensionEndpoint}/${id}/`).then(result => result.data);
}

export async function deactivateUserExtension(id) {
    return await axios.patch(`${ApiUrl}${DeactivateUserExtensionEndpoint}/${id}/`).then(result => result.data);
}
  
export async function newPasswordUserExtension(id, UserExtensionData) {
    return await axios.patch(`${ApiUrl}${UserExtensionPasswordEndpoint}/${id}/`, UserExtensionData).then(result => result.data);
}
/**
 * Copyright 2022 MobiledgeX, Inc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ADMIN_MANAGER } from '../../../helper/constant/perpetual'
import { authSyncRequest } from '../../service'
import { responseValid } from '../../config'
import { endpoint } from '../..'
import { localFields } from '../../fields'

export const keys = () => ([
    { field: localFields.username, serverField: 'Name', sortable: true, label: 'Username', visible: true, filter: true },
    { field: localFields.email, serverField: 'Email', sortable: true, label: 'Email', visible: true, filter: true },
    { field: localFields.emailVerified, serverField: 'EmailVerified', sortable: true, label: 'Email Verified', visible: true, clickable: true, format: true },
    { field: localFields.passHash, serverField: 'Passhash', label: 'Passhash' },
    { field: localFields.iter, serverField: 'Iter', label: 'Iter' },
    { field: localFields.familyName, serverField: 'FamilyName', label: 'Family Name' },
    { field: localFields.givenName, serverField: 'GivenName', label: 'GivenName' },
    { field: localFields.picture, serverField: 'Picture', label: 'Picture' },
    { field: localFields.nickName, serverField: 'Nickname', label: 'Nickname' },
    { field: localFields.createdAt, serverField: 'CreatedAt', label: 'Created At' },
    { field: localFields.updatedAt, serverField: 'UpdatedAt', label: 'Updated At' },
    { field: localFields.locked, serverField: 'Locked', label: 'Locked', sortable: true, visible: true, clickable: true, format: true },
    { field: localFields.role, label: 'Admin Manager', icon: 'admin_manager.svg', detailView: false }
])

export const iconKeys = () => ([
    { field: localFields.role, label: 'Admin Manager', icon: 'admin_manager.svg', clicked: false }
])

export const getKey = (data) => {
    return ({
        name: data[localFields.username]
    })
}

export const showAccounts = () => {
    return { method: endpoint.SHOW_ACCOUNTS, keys: keys(), iconKeys: iconKeys() }
}

export const deleteAccount = (self, data) => {
    let requestData = getKey(data)
    return { method: endpoint.DELETE_ACCOUNT, data: requestData, success: `Account ${data[localFields.username]} deleted successfully` }
}

export const settingLock = async (self, data) => {
    let mc = await authSyncRequest(self, { method: endpoint.SETTING_LOCK, data: data })
    return responseValid(mc)
}

export const multiDataRequest = (keys, mcList, specific) => {
    let accountDataList = [];
    let userDataList = [];
    for (let i = 0; i < mcList.length; i++) {
        let mc = mcList[i];
        if (mc.response) {
            let method = mc.request.method
            if (method === endpoint.SHOW_USERS) {
                userDataList = mc.response.data;
            }
            if (method === endpoint.SHOW_ACCOUNTS) {
                accountDataList = mc.response.data;
            }
        }
    }
    let dataList = accountDataList.map(account => {
        let user = userDataList.find(user => user[localFields.username] === account[localFields.username]);
        if (user && user[localFields.role] === ADMIN_MANAGER) {
            account[localFields.role] = user[localFields.role];
        }
        return account
    });
    return dataList;
}

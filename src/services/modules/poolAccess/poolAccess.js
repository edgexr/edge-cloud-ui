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

import { perpetual } from "../../../helper/constant"
import { redux_org } from '../../../helper/reduxData'
import { serverFields, localFields } from '../../fields'
import { endpoint } from '../..'
import { pick } from "../../../helper/constant/operators"

export const keys = () => ([
    { field: localFields.region, label: 'Region', serverField: serverFields.Region, sortable: true, visible: true, filter: true, key: true },
    { field: localFields.poolName, serverField: serverFields.CloudletPool, label: 'Pool Name', sortable: true, visible: true, filter: true, key: true },
    { field: localFields.operatorName, serverField: serverFields.CloudletPoolOrg, label: 'Operator', sortable: true, visible: true, filter: true, key: true },
    { field: localFields.organizationName, serverField: serverFields.Org, label: 'Developer', sortable: true, visible: true, key: true },
    { field: localFields.decision, serverField: serverFields.Decision, label: 'Status', visible: true, format: true },
    { field: localFields.confirm, label: 'Accepted', detailView: false }
])

const getRequestData = (data) => {
    return {
        [serverFields.Region]: data[localFields.region],
        [serverFields.CloudletPool]: data[localFields.poolName],
        [serverFields.CloudletPoolOrg]: data[localFields.operatorName],
        [serverFields.Org]: data[localFields.organizationName],
        [serverFields.Decision]: data[localFields.decision],
    }
}

const getShowRequestData = (self, data) => {
    let requestData = pick(data, [localFields.region])
    let organizationName = redux_org.isAdmin(self) ? data[localFields.organizationName] : redux_org.nonAdminOrg(self)
    if (organizationName) {
        if (data[localFields.type] === perpetual.DEVELOPER || redux_org.isDeveloper(self)) {
            requestData[serverFields.Org] = organizationName
        }
        else if (data[localFields.type] === perpetual.OPERATOR || redux_org.isOperator(self)) {
            requestData[serverFields.CloudletPoolOrg] = organizationName
        }
    }
    return requestData
}

export const createInvitation = (data) => {
    return { method: endpoint.CREATE_POOL_ACCESS_INVITATION, data: getRequestData(data), success: 'Invitation Created' }
}
export const createConfirmation = (data) => {
    return { method: endpoint.CREATE_POOL_ACCESS_CONFIRMATION, data: getRequestData(data), success: 'Access Granted' }
}

export const showConfirmation = (self, data) => {
    let requestData = getShowRequestData(self, data)
    if (requestData) {
        return { method: endpoint.SHOW_POOL_ACCESS_CONFIRMATION, data: requestData, keys: keys() }
    }
}

export const showInvitation = (self, data) => {
    let requestData = getShowRequestData(self, data)
    if (requestData) {
        return { method: endpoint.SHOW_POOL_ACCESS_INVITATION, data: requestData, keys: keys() }
    }
}

export const deleteConfirmation = (data) => {
    return { method: endpoint.DELETE_POOL_ACCESS_CONFIRMATION, data: getRequestData(data), success: 'Access Removed' }
}

export const deleteInvitation = (data) => {
    return { method: endpoint.DELETE_POOL_ACCESS_INVITATION, data: getRequestData(data), success: 'Invitation Removed' }
}

export const accessGranted = (self, orgInfo) => {
    let data = {}
    let organizationName = orgInfo[localFields.organizationName]
    if (organizationName) {
        if (orgInfo[localFields.type] === perpetual.DEVELOPER) {
            data[serverFields.Org] = organizationName
        }
        else if (orgInfo[localFields.type] === perpetual.OPERATOR) {
            data[serverFields.CloudletPoolOrg] = organizationName
        }
    }
    return { method: endpoint.SHOW_POOL_ACCESS_GRANTED, data, keys: keys() }
}

export const accessPending = (self, data) => {
    let requestData = getShowRequestData(self, data)
    if (requestData) {
        return { method: endpoint.SHOW_POOL_ACCESS_PENDING, data: requestData }
    }
}

export const multiDataRequest = (keys, mcList) => {
    let invitationList = []
    let confirmationList = []
    let dataList = []
    if (mcList && mcList.length > 0) {
        mcList.forEach(mc => {
            let request = mc.request
            let response = mc.response
            if (response && response.status === 200) {
                let data = response.data
                if (request.method === endpoint.SHOW_POOL_ACCESS_CONFIRMATION) {
                    confirmationList = data
                }
                else if (request.method === endpoint.SHOW_POOL_ACCESS_INVITATION) {
                    invitationList = data
                }
            }
        })

        if (invitationList.length > 0) {
            invitationList.forEach(invitation => {
                dataList.push({ ...invitation, invite: true })
            })
        }
        if (confirmationList.length > 0) {
            confirmationList.forEach(confirmation => {
                let exist = false
                dataList.forEach(data => {
                    if (data[localFields.poolName] === confirmation[localFields.poolName] && data[localFields.organizationName] === confirmation[localFields.organizationName] && data[localFields.operatorName] === confirmation[localFields.operatorName]) {
                        data.confirm = true
                        data.decision = confirmation[localFields.decision]
                        exist = true
                    }
                })

                if (!exist) {
                    dataList.push({ ...confirmation, confirm: true })
                }
            })
        }
    }
    return dataList
}
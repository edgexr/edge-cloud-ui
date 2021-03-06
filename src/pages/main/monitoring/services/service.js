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

import { redux_org } from "../../../../helper/reduxData";
import { localFields } from "../../../../services/fields";
import { requestAppInstLatency } from "../../../../services/modules/appInst";
import { authSyncRequest, multiAuthSyncRequest, showAuthSyncRequest } from "../../../../services/service";
import { showOrganizations } from '../../../../services/modules/organization';
import { processWorker } from "../../../../services/worker/interceptor";
import { timezonePref } from "../../../../utils/sharedPreferences_util";
import { legendKeys, resourceAPIs, showAPIs } from "../helper/constant";
import ShowWorker from '../services/show.worker.js'
import { _orderBy } from "../../../../helper/constant/operators";
import { responseValid } from "../../../../services/config";

export const fetchOrgList = async (self) => {
    let dataList = await showAuthSyncRequest(self, showOrganizations(self))
    if (dataList && dataList.length > 0) {
        return _orderBy(dataList, [item=>item[localFields.organizationName].toLowerCase()])
    }
}

export const fetchFlavorBySelection = async (self, data) => {
    const { worker, dataList, selection } = data
    if (dataList && dataList.length > 0) {
        const { legends, region, resourceType, values } = dataList[0]
        let response = await processWorker(self, worker, {
            legends,
            region,
            resource: resourceType,
            values,
            selection,
            region,
            timezone: timezonePref(),
            flavorSelection: true
        })
        if (response.status === 200) {
            return { datasets: response.datasets, values, region, legends, resourceType }
        }
    }
}

export const fetchResourceData = async (self, moduleId, data) => {
    const { region, orgInfo, legends, metricRequestData, resourceKey, range, worker, selection } = data
    if (resourceKey.serverRequest && metricRequestData && metricRequestData.length > 0) {
        let data = {}
        data[localFields.region] = region
        data[localFields.starttime] = range.starttime
        data[localFields.endtime] = range.endtime
        data[localFields.selector] = resourceKey.serverField
        data[localFields.organizationName] = orgInfo ? orgInfo[localFields.organizationName] : redux_org.nonAdminOrg(self)
        data[localFields.numsamples] = 50
        let request = resourceAPIs(self, resourceKey.serverRequest, data, metricRequestData)
        let mc = await authSyncRequest(this, { ...request, format: false })
        if (responseValid(mc)) {
            let response = await processWorker(self, worker, {
                response: { data: mc.response.data },
                request: request,
                parentId: moduleId,
                metricKeys: legendKeys(moduleId),
                region,
                metric: resourceKey,
                legends: legends,
                selection: selection,
                timezone: timezonePref()
            })
            if (response.status === 200) {
                return response
            }
        }
        return null
    }
}

//Fetch Show API (cloudlet, clusterInst, AppInst based on moduleId)
export const fetchShowData = async (self, moduleId, data) => {
    const { region, organization } = data
    let requestList = showAPIs(moduleId).map(request => {
        return request(self, { region, org: organization[localFields.organizationName], type:organization[localFields.type]})
    })
    let mcList = await multiAuthSyncRequest(this, requestList, false)
    if (mcList && mcList.length > 0) {
        let worker = ShowWorker()
        let response = await processWorker(self, worker, {
            requestList,
            parentId: moduleId,
            region,
            mcList,
            metricListKeys: legendKeys(moduleId),
            isOperator: redux_org.isOperator(self)
        })
        worker.terminate()
        if (response.status === 200 && response.list) {
            return { legends: response.data, legendList: response.list }
        }
    }
}

export const requestLantency = async (self, data) => {
    let mc = await requestAppInstLatency(self, data)
    if (responseValid(mc)) {
        self.props.handleAlertInfo('success', mc.response.data.message)
    }
    else {
        if (mc.error && mc.error.response && mc.error.response.data && mc.error.response.data.message)
            self.props.handleAlertInfo('error', mc.error.response.data.message)
    }
}
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

import { appInstKeys, showAppInsts } from "../../../../../services/modules/appInst";
import { appInstMetrics, appInstMetricsElements } from "../../../../../services/modules/appInstMetrics";
import { showCloudlets } from "../../../../../services/modules/cloudlet";
import { showCloudletInfoData } from "../../../../../services/modules/cloudletInfo";
import { cloudletMetricsElements, cloudletUsageMetrics } from "../../../../../services/modules/cloudletMetrics/cloudletMetrics";
import { clusterInstKeys, showClusterInsts } from "../../../../../services/modules/clusterInst";
import { clusterInstMetricsElements, clusterMetrics } from "../../../../../services/modules/clusterInstMetrics";
import { authSyncRequest, multiAuthSyncRequest } from "../../../../../services/service";
import { processWorker } from "../../../../../services/worker/interceptor";
import { formatMetricData } from "./metric";
import { AIK_APP_CLOUDLET_CLUSTER } from "../../../../../services/modules/appInst/primary";
import { CIK_CLOUDLET_CLUSTER } from "../../../../../services/modules/clusterInst/primary";
import { localFields } from "../../../../../services/fields";
import { isEmpty } from '../../../../../utils/json_util';
import { redux_org } from "../../../../../helper/reduxData";

/**
 * 
 * @param {Object} item sunburst selection 
 * @returns resources 
 */
export const fetchSpecificResources = async (self, item) => {
    let resources = undefined
    if (item?.data) {
        let data = item.data
        let numsamples = 1
        data.selector = '*'
        data.numsamples = numsamples
        if (item.field === localFields.cloudletName || item.field === localFields.appName || item.field === localFields.clusterName) {
            let elements
            let request
            if (item.field === localFields.cloudletName) {
                elements = cloudletMetricsElements
                request = cloudletUsageMetrics(self, data, true)
            }
            else if (item.field === localFields.appName) {
                elements = appInstMetricsElements
                request = appInstMetrics(self, data, [appInstKeys(data, AIK_APP_CLOUDLET_CLUSTER)])
            }
            else {
                elements = clusterInstMetricsElements
                request = clusterMetrics(self, data, [clusterInstKeys(data, CIK_CLOUDLET_CLUSTER)])
            }
            await Promise.all(elements.map(async (element) => {
                request.data.selector = element.selector ? element.selector : request.data.selector
                let mc = await authSyncRequest(self, { ...request, format: false })
                let metricData = formatMetricData(element, numsamples, mc)
                if (!isEmpty(metricData)) {
                    if (element.selector === 'flavorusage' && metricData) {
                        const { flavorName, count } = metricData
                        resources = resources ?? {}
                        resources.flavor = { label: 'Flavor', icon: element.icon, value: `${count?.value ?? 0}  \u2715  ${flavorName?.value}` }
                    }
                    else {
                        resources = { ...resources, ...metricData }
                    }
                }
            }))
        }
    }
    return resources
}

/**
 * 
 * @param {Object} worker control worker object 
 * @returns 
 */
export const fetchShowData = async (self, worker, sequence, regions) => {
    let mcsList = []
    await Promise.all(regions.map(async (region) => {
        let requestList = [];
        let requestMethods = [showCloudlets, showCloudletInfoData]
        if(!redux_org.isOperator(self))
        {
            requestMethods.push(showClusterInsts)
            requestMethods.push(showAppInsts)
        }
        requestMethods.forEach(requestType => {
            let request = requestType(self, Object.assign({}, { region }))
            requestList.push({...request, showSpinner:false})
        })
        if (requestList.length > 0) {
            let mcList = await multiAuthSyncRequest(self, requestList, false)
            mcsList.push({rawList:mcList, region})
        }
    }))
    return await processWorker(self, worker, {
        mcsList,
        sequence,
        initFormat: true
    })
}
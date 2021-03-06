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

import { timeRangeInMin } from "../../../../hoc/mexui/Picker"

export const DEFAULT_DURATION_MINUTES = 720

export const auditKeys = [
    { label: 'Operation Name', field: 'name', format: true, visible: true, detail: true, filter: true },
    { label: 'Start Time', field: 'timestamp', visible: true, format: true, detail: true },
    { label: 'Trace ID', field: 'traceid', mtags: true, visible: true, detail: true },
    { label: 'IP Address', field: 'remote-ip', mtags: true, visible: true, detail: true },
    { label: 'Duration', field: 'duration', mtags: true, visible: true, detail: true },
    { label: 'Status', field: 'status', mtags: true, visible: true, detail: true },
]

export const eventKeys = [
    { label: 'Start Time', field: 'timestamp', visible:true, format: true, detail: true },
    { label: 'Name', field: 'name', filter: true, visible:true, detail: false },
    { label: 'App', field: 'app', mtags: true, visible: true, filter: true, detail: false, format: true },
    { label: 'Version', field: 'appver', mtags: true, filter: true, detail: false },
    { label: 'Developer', field: 'apporg', mtags: true, visible: true, filter: true, detail: false },
    { label: 'Cloudlet', field: 'cloudlet', mtags: true, visible: true, filter: true, detail: false, format: true },
    { label: 'Operator', field: 'cloudletorg', mtags: true, filter: true, detail: false },
    { label: 'Cluster', field: 'cluster', mtags: true, visible: true, filter: true, detail: false, format: true },
    { label: 'Cluster Org', field: 'clusterorg', mtags: true, filter: true },
    { label: 'Host Name', field: 'hostname', mtags: true, detail: true },
    { label: 'Line No', field: 'lineno', mtags: true, detail: true },
    { label: 'Node', field: 'node', mtags: true, detail: true },
    { label: 'Node Region', field: 'noderegion', mtags: true, detail: true },
    { label: 'Node Type', field: 'nodetype', mtags: true, detail: true },
    { label: 'Trace ID', field: 'traceid', mtags: true, detail: true },
    { label: 'Span ID', field: 'spanid', mtags: true, detail: true },
    { label: 'Duration', field: 'duration', mtags: true, detail: true },
    { label: 'State', field: 'state', mtags: true, detail: true },
    { label: 'Reason', field: 'reason', mtags: true, detail: true },
    { label: 'Error', field: 'error', filter: false, detail: true }
]

export const defaultRange = (self) => {
    const range = timeRangeInMin(DEFAULT_DURATION_MINUTES)
    self.starttime = range.from
    self.endtime = range.to
}
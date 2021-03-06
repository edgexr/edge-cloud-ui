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

/* eslint-disable */
import { CON_TAGS, CON_TOTAL, CON_VALUES, PARENT_APP_INST } from "../../../../helper/constant/perpetual"
import { localFields } from "../../../../services/fields"
import { center } from "../../../../utils/math_utils"
import { fetchColorWithElimination } from "../../../../utils/color_utils"
import { generateColor, severityHexColors } from "../../../../utils/heatmap_utils"
import { _avg, _min, _max } from "../../../../helper/constant/operators"

const precision = (data)=>{
    return `${data.toFixed(2)} ms`
}

const formatTime = (data, timeZone)=>{
    return new Date(data).toLocaleString("en-US", { timeZone })
}

const appendMS = (data)=>{
    return `${data} ms`
}

const appCSVKey = [
    { label: 'Time', index: 0, format: formatTime },
    { label: 'App', index: 11 },
    { label: 'Version', index: 19 },
    { label: 'App Organization', index: 12 },
    { label: 'Cloudlet', index: 13 },
    { label: 'Operator', index: 14 },
    { label: 'Cluster', index: 15 },
    { label: 'Cluster Organization', index: 16 },
    { label: 'No. of Samples', index: 10 },
    { label: '0-5 ms', index: 1 },
    { label: '5-10 ms', index: 2 },
    { label: '10-25 ms', index: 3 },
    { label: '25-50 ms', index: 4 },
    { label: '50-100 ms', index: 5 },
    { label: '>100ms', index: 6 },
    { label: 'Max Latency', index: 7, format: appendMS },
    { label: 'Min Latency', index: 8, format: appendMS },
    { label: 'Avg Latency', index: 9, format: precision },
    { label: 'Location Tile', index: 18 },
    { label: 'Network Type', index: 17 }
]

const cloudletCSVKey = [
    { label: 'Time', index: 0, format: formatTime },
    { label: 'Cloudlet', index: 11 },
    { label: 'Operator', index: 12 },
    { label: 'No. of Samples', index: 10 },
    { label: '0-5 ms', index: 1 },
    { label: '5-10 ms', index: 2 },
    { label: '10-25 ms', index: 3 },
    { label: '25-50 ms', index: 4 },
    { label: '50-100 ms', index: 5 },
    { label: '>100ms', index: 6 },
    { label: 'Max Latency', index: 7, format: appendMS },
    { label: 'Min Latency', index: 8, format: appendMS },
    { label: 'Avg Latency', index: 9, format: precision },
    { label: 'Location Tile', index: 15 },
    { label: 'Device Carrier', index: 14 },
    { label: 'Network Type', index: 13 }
]

const formatCSV = (id, timeZone, item) => {
    let csvKeys = id === PARENT_APP_INST ? appCSVKey : cloudletCSVKey
    let data = csvKeys.map(key => {
        return key.format ? key.format(item[key.index], timeZone) : item[key.index]
    })
    return data
}
const formatColumns = (columns, keys) => {
    let newColumns = []
    keys.forEach(key => {
        const index = columns.indexOf(key.serverField)
        if (key.serverField) {
            newColumns[index] = { ...key, index }
        }
    })
    return newColumns
}

const generateKey = (columns, value, level) => {
    let key = ''
    columns.forEach((item, i) => {
        if (item.groupBy === level) {
            if (key.length > 0) {
                key = key + '_'
            }
            key = key + value[i]
        }
    })
    return key.toLowerCase()
}

const formatTile = (tags, item) => {
    const tiles = item.split('_')
    let geo1 = undefined
    let geo2 = undefined
    tiles.forEach((tile, i) => {
        if (i === 2) {
            tags['length'] = tile
        }
        else {
            const cords = tile.split(',')
            if (geo1 === undefined) {
                geo1 = [cords[1], cords[0]]
            }
            else if (geo2 === undefined) {
                geo2 = [cords[1], cords[0]]
            }
        }
    })
    tags[localFields.location] = center(...geo1, ...geo2)
}

const sumLatency = (columns, total, values, isObject) => {
    if (total) {
        columns.forEach(column => {
            let value = isObject ? values[column.field] : values[column.index]
            if (column.sum) {
                total[column.field] = total[column.field] + value
            }
            else if (column.concat) {
                total[column.field] = [...total[column.field], value]
            }
        })
    }
    else {
        total = {}
        columns.forEach(column => {
            let value = isObject ? values[column.field] : values[column.index]
            if (column.sum) {
                total[column.field] = value
            }
            else if (column.concat) {
                total[column.field] = [value]
            }
        })
    }
    return total
}

const nGrouper = (parent, key, value, columns, selections, levellength, level) => {
    parent[key] = parent[key] ? parent[key] : {}
    parent[key][CON_VALUES] = parent[key][CON_VALUES] ? parent[key][CON_VALUES] : level < levellength ? {} : []
    if (!parent[key][CON_TAGS]) {
        let tags = {}
        value.forEach((item, i) => {
            const column = columns[i]
            if (column && column.groupBy === level) {
                if (column.field === localFields.locationtile) {
                    formatTile(tags, item)
                }
                else {
                    tags[column.field] = item
                }
            }
        })
        if (level === 2) {
            let selection = undefined
            for (const item of selections) {
                let valid = true
                for (const column of columns) {
                    if (column && column.groupBy === level) {
                        valid = tags[column.field] === item[column.field]
                        if (!valid) {
                            break;
                        }
                    }
                }
                if (valid) {
                    selection = item
                    break;
                }
            }
            const location = selection[localFields.cloudletLocation]
            tags[localFields.cloudletLocation] = location
        }

        parent[key][CON_TAGS] = tags
    }
    if (level < levellength) {
        let nextKey = generateKey(columns, value, level + 1)
        parent[key][CON_VALUES][nextKey] = nGrouper(parent[key][CON_VALUES], nextKey, value, columns, selections, levellength, level + 1)[nextKey]
        parent[key][CON_TOTAL] = sumLatency(columns, parent[key][CON_TOTAL], value)
    }
    else {
        let values = {}
        value.forEach((item, i) => {
            const column = columns[i]
            if (column && column.groupBy === undefined) {
                values[column.field] = item
            }
        })
        parent[key][CON_VALUES].push(values)
        parent[key]['total'] = sumLatency(columns, parent[key][CON_TOTAL], value)
    }
    return parent
}

const grouper = (dataList, columns, selections, levellength, level = 1) => {
    let parent = {}
    let slider = []
    dataList.forEach(item => {
        let key = generateKey(columns, item, level)
        parent = nGrouper(parent, key, item, columns, selections, levellength, level)
    })

    let colors = fetchColorWithElimination(selections.length, severityHexColors)
    let usedColors = {}
    let starttime = undefined
    Object.keys(parent).forEach((key, j) => {
        const appInstObject = parent[key][CON_VALUES]
        const time = parent[key][CON_TAGS].time.toLowerCase()
        if (starttime === undefined) {
            starttime = time
        }
        const total = parent[key][CON_TOTAL]
        const avg = _avg(total['avg'])
        const min = _min(total['min'])
        const max = _max(total['max'])
        slider.push({ value: j, label: time, avg, color_avg: generateColor(avg), min, color_min: generateColor(min), max, color_max: generateColor(max) })
        let appInstKeys = Object.keys(appInstObject)
        appInstKeys.forEach((appInstKey, i) => {
            let color = colors[i]
            if(usedColors[appInstKey])
            {
                color = usedColors[appInstKey]
            }
            else
            {
                usedColors[appInstKey] = colors[i]
                colors.splice(i, 1)
            }
            appInstObject[appInstKey][CON_TAGS].color = color
        })
    })
    
    // for (let i = 1; i < 100; i++) {
    //     slider.push({ value: i, label: '2021-05-13t01:00:00z', color_avg: generateColor(i), color_min: generateColor(3),color_max: generateColor(i)  })
    // }
    return { data: parent, slider, starttime }
}

const mergeData = (data)=>{
    let {columns, values, tags} = data
    const tagKeys = Object.keys(tags)
    const tagValues = tagKeys.map(key=>{
        if(key === 'datanetworktype')
        {
            return tags[key].replace('NETWORK_TYPE_', '')
        }
        return tags[key]
    })
    columns = [...columns, ...tagKeys]
    values = values.map(value => {
        value = [...value, ...tagValues]
        return value
    })
    return { columns, values }
}

const formatMetricUsage = (worker) => {
    const { id, request, response, selections, timezone } = worker
    let formatted
    let csvKeys = id === PARENT_APP_INST ? appCSVKey : cloudletCSVKey
    let csvData = [csvKeys.map(key => { return key.label })]
    if (response && response.data && response.data.data) {
        const dataList = response.data.data;
        if (dataList && dataList.length > 0) {
            const series = dataList[0].Series
            const messages = dataList[0].messages
            if (series && series.length > 0) {
                const keys = request.keys
                const requestData = request.data
                let mergedData = { values: [] }
                for (const data of series) {
                    let dataValid = false
                    if (id === PARENT_APP_INST) {
                        for (let selection of selections) {
                            if (selection[localFields.cloudletName] === data[CON_TAGS]['cloudlet'] && selection[localFields.operatorName] === data[CON_TAGS]['cloudletorg'] && selection[localFields.clusterName] === data[CON_TAGS]['cluster'] && selection[localFields.clusterdeveloper] === data[CON_TAGS]['clusterorg']) {
                                dataValid = true
                                break;
                            }
                        }
                    }
                    else
                    {
                        dataValid = true
                    }
                    if (dataValid) {
                        const { columns, values } = mergeData(data)
                        mergedData.columns = columns
                        for (let item of values) {
                            let valid = false
                            for (let i = 0; i < columns.length; i++) {
                                let column = columns[i]
                                if (column === localFields._0s || column === localFields._5ms || column === localFields._10ms || column === localFields._25ms || column === localFields._50ms || column === localFields._100ms) {
                                    if (item[i] !== null) {
                                        valid = true
                                        break;
                                    }
                                }
                            }
                            if (valid) {
                                csvData.push(formatCSV(id, timezone, item))
                                mergedData.values.push(item)
                            }
                        }
                    }
                }
                if (mergedData.values.length > 0) {
                    const columns = formatColumns(mergedData.columns, keys)
                    formatted = grouper(mergedData.values, columns, selections, 3)
                }
            }
        }
    }
    self.postMessage({ ...formatted, csvData })
}
export const format = (worker) => {
    formatMetricUsage(worker)
}

self.addEventListener("message", (event) => {
    format(event.data)
});
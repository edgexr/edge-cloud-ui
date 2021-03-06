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

import React from 'react'
import MyLocationOutlinedIcon from '@material-ui/icons/MyLocationOutlined';
import { perpetual } from '../../../../../helper/constant';
import { localFields } from '../../../../../services/fields';
import { IconButton } from '../../../../../hoc/mexui'
import './style.css'
import { generateColor } from '../../../../../utils/heatmap_utils';
import { _avg } from "../../../../../helper/constant/operators"

export const keys = [
    { label: '0 - 5 ms', field: localFields._0s, default: 0 },
    { label: '5 - 10 ms', field: localFields._5ms, default: 0 },
    { label: '10 - 25 ms', field: localFields._10ms, default: 0 },
    { label: '25 - 50 ms', field: localFields._25ms, default: 0 },
    { label: '50 - 100 ms', field: localFields._50ms, default: 0 },
    { label: '> 100 ms', field: localFields._100ms, default: 0 }
]

const Details = (props) => {

    const { data, markerType } = props
    const values = data[perpetual.CON_VALUES]
    const tags = data[perpetual.CON_TAGS]
    return (
        <React.Fragment>
            <div className='details-main' align='center'>
                <div className='details-header'><h4><b>Number of Samples</b></h4></div>
                <table className="details">
                    <thead>
                        <tr>
                            <th>Location Tile</th>
                            {keys.map((item, i) => (
                                <th key={i}>{item.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {
                            Object.keys(values).map((key, i) => {
                                const childTotal = values[key][perpetual.CON_TOTAL]
                                const location = values[key][perpetual.CON_TAGS][localFields.location]
                                return (
                                    <tr key={i}>
                                        <td><IconButton tooltip='View aggregated location tile latency' onMouseOver={()=>{props.onMouseOver(location)}} onMouseOut={props.onMouseOut} onClick={() => { props.onClick(key, values, [location.lat, location.lng]) }}><MyLocationOutlinedIcon style={{ color: generateColor(_avg(childTotal[markerType])) }} /></IconButton></td>
                                        {keys.map((item, j) => (
                                            <td key={`${i}_${j}`}>{childTotal[item.field] ? childTotal[item.field] : item.default}</td>
                                        ))}
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
            </div>
        </React.Fragment>
    )
}

export default Details
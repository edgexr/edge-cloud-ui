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
import { connect } from 'react-redux'
import EventList from '../../list/EventList'
import { orgEvents } from '../../../../../services/modules/audit'
import { redux_org } from '../../../../../helper/reduxData'
import randomColor from 'randomcolor'
import { CircularProgress, IconButton, Tooltip } from '@material-ui/core'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { authSyncRequest } from '../../../../../services/service'

const clusterEventKeys = [
    { label: 'Cluster', serverField: 'cluster', summary: false, filter: true },
    { label: 'Cluster Developer', serverField: 'clusterorg', summary: false, filter: true },
    { label: 'Cloudlet', serverField: 'cloudlet', summary: true, filter: true },
    { label: 'Operator', serverField: 'cloudletorg', summary: true, filter: true },
    { label: 'Hostname', serverField: 'hostname', summary: true },
    { label: 'Line no', serverField: 'lineno', summary: true },
    { label: 'Span ID', serverField: 'spanid', summary: true },
    { label: 'State', serverField: 'state', summary: true },
    { label: 'Trace ID', serverField: 'traceid', summary: true },
]

class MexAppEvent extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            eventData: [],
            colors: [],
            showMore: false,
            loading: false
        }
        this.regions = props.regions
    }

    header = (data) => {
        let cluster = data['cluster']
        return (
            <React.Fragment>
                {cluster}
            </React.Fragment>
        )
    }

    loadMore = () => {
        let starttime = this.props.range.starttime
        let eventData = this.state.eventData
        let endtime = eventData[eventData.length - 1]['timestamp']
        this.event({ starttime, endtime }, true)
    }

    render() {
        const { eventData, colors, showMore, loading } = this.state
        const { filter } = this.props
        return (
            <div>
                <EventList header='Events' eventData={eventData} filter={filter} colors={colors} keys={clusterEventKeys} header={this.header} itemSize={90} itemExpandSize={300} />
                {showMore ? <div className='event-list-more' align="center">
                    {loading ? <CircularProgress size={20} /> :
                        <Tooltip title='More' onClick={this.loadMore}>
                            <IconButton>
                                <ExpandMoreIcon />
                            </IconButton>
                        </Tooltip>}
                </div> : null}
            </div>
        )
    }

    event = async (range, more) => {
        this.setState({ loading: true })
        const requestData = orgEvents({
            match: {
                orgs: [redux_org.isAdmin(this) ? this.props.org : redux_org.nonAdminOrg(this)],
                types: ["event"],
                tags: { cluster: "*" },
                names: ["*cluster*", "*Cluster*"]
            },
            starttime: range.starttime,
            endtime: range.endtime,
            more: more,
            limit: 10
        })
        let mc = await authSyncRequest(this, { ...requestData, format: false })
        if (mc && mc.response && mc.response.status === 200) {
            let more = mc.request.data.more
            let dataList = mc.response.data
            let showMore = dataList.length === 10
            let colors = randomColor({ count: dataList.length, })
            if (more) {
                dataList = [...this.state.eventData, ...dataList]
                colors = [...this.state.colors, ...colors]
            }
            this.setState({ eventData: dataList, colors, showMore })
        }
        this.setState({ loading: false })
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.org !== this.props.org) {
            this.setState({ eventData: [] }, () => {
                this.event(this.props.range)
            })
        }
        if (prevProps.range !== this.props.range) {
            this.event(this.props.range)
        }
    }

    componentDidMount() {
        if (!redux_org.isAdmin(this) || this.props.org) {
            this.event(this.props.range)
        }
    }
}

const mapStateToProps = (state) => {
    return {
        organizationInfo: state.organizationInfo.data
    }
};

export default connect(mapStateToProps, null)(MexAppEvent);
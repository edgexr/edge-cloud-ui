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
import { connect } from 'react-redux';
import { Accordion as MuiAccordion, AccordionDetails, AccordionSummary, Typography } from '@material-ui/core'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { CHECKBOX_ARRAY } from '../../../../hoc/forms/MexForms'
import { withStyles } from '@material-ui/styles';
import { PREF_MONITORING } from './Preferences';
import CheckBoxArray from '../../../../hoc/forms/CheckBoxArray'
import { PREF_M_APP_VISIBILITY, PREF_M_CLOUDLET_VISIBILITY, PREF_M_CLUSTER_VISIBILITY, PREF_M_REGION } from '../../../../utils/sharedPreferences_util';
import { redux_org } from '../../../../helper/reduxData';

const cloudletVisibility = ["vCpu Infra Usage", "Disk Infra Usage", "Memory Infra Usage", "External IP Used", "Floating IP Used", "GPU Used", "Instances Used", "RAM Used", "vCPUs Used", "Flavor Usage", "Map", "Event"]
const clusterVisibility = ["CPU", "Memory", "Disk Usage", "Network Sent", "Network Received", "Map"]
const appInstVisibility = ["CPU", "Memory", "Disk Usage", "Network Sent", "Network Received", "Active Connections", "Map", "Event", "Client Usage"]

const Accordion = withStyles({
    root: {
        borderBottom: '1px solid rgba(0, 0, 0, .125)',
        '&:not(:last-child)': {
            borderBottom: '1px solid rgba(0, 0, 0, .125)',
        },
        boxShadow: 'none',
        '&:before': {
            display: 'none',
        },
        '&$expanded': {
            margin: 'auto',
        },
    },
    expanded: {},
})(MuiAccordion);

class MonitoringPreferences extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            forms: []
        }
        this.regions = this.props.regions
    }

    cloudletForms = () => ([
        { field: PREF_M_CLOUDLET_VISIBILITY, label: 'Visibility', formType: CHECKBOX_ARRAY, value: cloudletVisibility, options: cloudletVisibility },
    ])

    clusterForms = () => ([
        { field: PREF_M_CLUSTER_VISIBILITY, label: 'Visibility', formType: CHECKBOX_ARRAY, value: clusterVisibility, options: clusterVisibility },
    ])

    appInstForms = () => ([
        { field: PREF_M_APP_VISIBILITY, label: 'Visibility', formType: CHECKBOX_ARRAY, value: appInstVisibility, options: appInstVisibility },
    ])

    forms = () => ([
        { field: PREF_M_REGION, label: 'Region', formType: CHECKBOX_ARRAY, value: this.regions, expanded: true, options: this.regions, visible: true },
        { label: 'Cloudlet', forms: this.cloudletForms(), visible:  redux_org.isAdmin(this) || redux_org.isOperator(this)},
        { label: 'Cluster', forms: this.clusterForms(), visible:  redux_org.isAdmin(this) || redux_org.isDeveloper(this) || redux_org.isOperator(this)},
        { label: 'App Instances', forms: this.appInstForms(), visible: redux_org.isAdmin(this) ||  redux_org.isDeveloper(this) ||  redux_org.isOperator(this)}
    ])


    onValueChange = (index, form, option) => {
        if (form.value.includes(option)) {
            form.value = form.value.filter(item => {
                return item !== option
            })
        }
        else {
            form.value.push(option)
        }
        this.setState(prevState => {
            let forms = prevState.forms
            if (form.parentIndex) {
                forms[form.parentIndex].forms[index] = form
            }
            else {
                forms[index] = form
            }
            return { forms }
        })

        let data = this.props.data ? this.props.data : {}
        data[PREF_MONITORING] = data[PREF_MONITORING] ? data[PREF_MONITORING] : {}
        data[PREF_MONITORING][form.field] = form.value
        this.props.update(data)
    }

    render() {
        const { forms } = this.state
        return (
            <div>
                {forms.map((form, i) => (
                      form.visible ?                   
                        form.forms ?
                            <Accordion key={i}>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls={i}
                                    id={i}
                                >
                                   <Typography>{form.label}</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    {form.forms.map((childForm, j) => {
                                        childForm.parentIndex = i
                                        return (
                                            <React.Fragment key={j}>
                                                <CheckBoxArray position={j} form={childForm} onChange={this.onValueChange} />
                                            </React.Fragment>
                                        )
                                    })}
                                </AccordionDetails>
                            </Accordion> :
                            <React.Fragment key={i}>
                                <div style={{ padding: 15, marginTop: 10 }}>
                                    <CheckBoxArray position={i} form={form} onChange={this.onValueChange} />
                                </div>
                            </React.Fragment> :null
                ))}
            </div>
        )
    }

    loadDefaultData = (forms, data) => {
        if (data) {
            for (let form of forms) {
                if (form.forms) {
                    this.loadDefaultData(form.forms, data)
                }
                else {
                    form.value = data[form.field] !== undefined ? data[form.field] : form.value
                }
            }
        }
    }

    componentDidMount() {
        let forms = this.forms()
        let data = this.props.data ? this.props.data[PREF_MONITORING] : undefined
        this.loadDefaultData(forms, data)
        this.setState({ forms })
    }
}

const mapStateToProps = (state) => {
    return {
        organizationInfo: state.organizationInfo.data,
        regions: state.regionInfo.region
    }
};

export default connect(mapStateToProps, null)(MonitoringPreferences);
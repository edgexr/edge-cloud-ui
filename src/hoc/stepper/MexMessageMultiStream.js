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

import React, { useRef, useEffect } from 'react'
import { Dialog, DialogContent, Divider, Grid, Accordion, AccordionSummary, AccordionDetails, Typography, IconButton } from '@material-ui/core';
import { Stepper, Step, StepLabel, CircularProgress } from '@material-ui/core';
import { makeStyles } from "@material-ui/core/styles";
import Check from "@material-ui/icons/Check";
import ErrorIcon from '@material-ui/icons/Error';
import { green, red } from '@material-ui/core/colors';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import CloseIcon from '@material-ui/icons/Close';
import { localFields } from '../../services/fields';
export const CODE_FINISH = 100;
export const CODE_SUCCESS = 200;
export const CODE_FAILED = 400;
let header = 'Cloudlet';

const useStyles = makeStyles(theme => ({

    root: {
        backgroundColor: 'transparent',
        zIndex: 1,
        color: '#fff',
        width: 25,
        height: 25,
        display: 'flex',
        borderRadius: '50%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    wrapper: {
        margin: theme.spacing(1),
        position: "relative"
    },
    stepper: {
        backgroundColor: '#24252b'
    },
    label: {
        color: '#FFF',
        width: '100%',
        fontWeight: 500,
        wordWrap: "break-word"
    },
    iconLabel: {
        fontSize: 15
    },
    progress: {
        position: "absolute",
        color: "#FFF",
        top: 0,
        left: -6,
        zIndex: 1
    },
    success: {
        backgroundColor: green[500],
        borderRadius: '50%',
        width: 20,
        height: 20,
        fontSize: 10
    },
    error: {
        color: red[500],
        borderRadius: '50%',
        width: 23,
        height: 23,
        fontSize: 10
    },
    dividerColor: {
        backgroundColor: '#88dd00'
    },
    close_btn: {
        color: '#88dd00'
    },
}));

export const updateStepper = (stepsArray, labels, data, serverData, wsObj) => {
    let currentSteps = null;
    let id = data[localFields.uuid]
    header = labels[0].label
    if (stepsArray && stepsArray.length > 0) {
        stepsArray = stepsArray.map((item, i) => {
            if (id === item.id) {
                if (serverData) {
                    currentSteps = item;
                }
                else {
                    item.steps.push({ code: CODE_FINISH })
                }
            }
            return item
        })
    }

    if (serverData) {
        let step = { code: serverData.code, message: serverData.data.message }
        if (currentSteps === null) {
            stepsArray.push({ data: data, labels: labels, id: id, steps: [step], wsObj: wsObj })
        }
        else {
            stepsArray.map((item, i) => {
                if (id === item.id) {
                    item.steps.push(step)
                }
            })
        }
    }
    return stepsArray
}


const MexMessageMultiStream = (props) => {
    const body = useRef();
    const classes = useStyles();
    useEffect(() => {
        if (body.current && props.uuid !== 0) {
            body.current.scrollTop = body.current.scrollHeight;
        }
    })

    const getSummary = (data) => (
        <AccordionSummary
            style={{ backgroundColor: '#24252b', color: 'white', wordBreak: 'break-word' }}
            expandIcon={<ExpandMoreIcon style={{ color: 'white' }} />}
            aria-controls="panel1a-content"
            id="panel1a-header"
        >
            <Typography>{data}</Typography>
        </AccordionSummary>
    )
    const getDataSummary = (steps) => {
        let step = steps[steps.length - 1]
        step = step.code === CODE_FINISH ? steps[steps.length - 2] : step
        return getSummary(step.message)
    }

    const getHeaderDetails = (item) => {
        let data = item.data
        let labels = item.labels
        return (
            <AccordionDetails style={{ backgroundColor: '#24252b', color: 'white' }}>
                <div ref={body} style={{ backgroundColor: '#24252b', overflowY: 'auto', maxHeight: 400 }}>
                    {labels.map((info, i) => {
                        if (i > 0)
                            return <p key={i}><b>{info.label}</b>&nbsp;-&nbsp;{data[info.field]}</p>
                    })}
                </div>
            </AccordionDetails>
        )
    }


    const getStepLabel = (item, stepperProps) => {
        let code = item.steps[stepperProps.icon - 1].code;
        return (<div className={classes.root}>
            {
                stepperProps.completed ?
                    code === CODE_FAILED ?
                        <ErrorIcon className={classes.error} /> :
                        <Check className={classes.success} /> :
                    <div className={classes.wrapper}>
                        <p className={classes.iconLabel}>{stepperProps.icon}</p>
                        <CircularProgress className={classes.progress} size={25} thickness={3} />
                    </div>
            }
        </div>)
    }

    const getDetails = (item) => {
        return (
            <AccordionDetails style={{ backgroundColor: '#24252b', color: 'white' }}>
                <div ref={body} style={{ backgroundColor: '#24252b', overflowY: 'auto', maxHeight: 400 }}>
                    <Stepper className={classes.stepper} activeStep={item.steps[item.steps.length - 1].code === CODE_FINISH ? item.steps.length : item.steps.length - 1} orientation="vertical">
                        {item.steps.map((step, index) => {
                            return (
                                step.message ?
                                    <Step key={index}>
                                        <StepLabel StepIconComponent={(stepperProps) => {
                                            return getStepLabel(item, stepperProps)
                                        }}><p className={classes.label}>{step.message}</p></StepLabel>
                                    </Step>
                                    :
                                    null
                            )
                        })}
                    </Stepper>
                </div>
            </AccordionDetails>
        )
    }
    return (
        props.multiStepsArray.length > 0 ?
            <div>
                {
                    <Dialog open={props.multiStepsArray.length > 0} maxWidth='lg' fullWidth={true}>
                        <div style={{ backgroundColor: '#24252b' }} align="right">
                            <IconButton aria-label="delete" className={classes.close_btn} onClick={(e) => props.onClose()}>
                                <CloseIcon />
                            </IconButton>
                        </div>
                        <DialogContent style={{ background: '#24252b', maxHeight: 600 }}>
                            <Grid container spacing={2} style={{ paddingLeft: 10, paddingRight: 10 }}>
                                <Grid item xs={3}>
                                    <h4 style={{ padding: '13px 0', color: '#88dd00' }}><strong>{header}</strong></h4>
                                </Grid>
                                <Grid item xs={9}>
                                    <h4 style={{ padding: '13px 0', color: '#88dd00' }} align="center"><strong>Progress</strong></h4>
                                </Grid>
                            </Grid>
                            <Divider classes={{ root: classes.dividerColor }} />
                            {props.multiStepsArray.map((item, i) => {
                                return (
                                    <div key={i}>
                                        <Grid container spacing={2} style={{ padding: 10 }}>
                                            <Grid item xs={3}>
                                                {item.labels.length > 1 ?
                                                    <Accordion>
                                                        {getSummary(item.data[item.labels[0].field])}
                                                        {getHeaderDetails(item)}
                                                    </Accordion> :
                                                    <h4 style={{ padding: '13px 0', color: '#DDDD' }}>{item.data[item.labels[0].field]}</h4>}
                                            </Grid>
                                            <Grid item xs={9}>
                                                {

                                                    <Accordion>
                                                        {getDataSummary(item.steps)}
                                                        {getDetails(item)}
                                                    </Accordion>
                                                }
                                            </Grid>
                                        </Grid>
                                    </div>)
                            })}

                        </DialogContent>

                    </Dialog>}
            </div> : null
    )
}

export default MexMessageMultiStream;


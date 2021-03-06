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

import React from 'react';
import { useSelector } from 'react-redux';
import { redux_org } from '../../helper/reduxData';
import cloneDeep from 'lodash/cloneDeep';
import MexSelect from './MexSelect';
import MexMultiSelect from './MexMultiSelect'
import MexInput from './MexInput';
import MexPopupInput from './MexPopupInput';
import MexTextArea from './MexTextArea';
import MexDualList from './MexDualList';
import MexSwitch from './MexSwitch';
import MexButton from './MexButton';
import MexDate from './MexDate';
import MexTimeCounter from './MexTimeCounter';
import MexSelectTree from './selectTree/MexSelectTree';
import MexSelectTreeGroup from './selectTree/MexSelectTreeGroup';
import { Form, Grid, Divider } from 'semantic-ui-react';
import { IconButton as MIB, makeStyles, Tooltip } from '@material-ui/core';
import { uniqueId } from '../../helper/constant/shared';
import { IconButton } from '../mexui';
import Alert from '@material-ui/lab/Alert';

//Icons
import AddIcon from '@material-ui/icons/Add';
import DeleteOutlineOutlinedIcon from '@material-ui/icons/DeleteOutlineOutlined';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import ClearIcon from '@material-ui/icons/Clear';
import ContactSupportOutlinedIcon from '@material-ui/icons/ContactSupportOutlined';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import AddToPhotosOutlinedIcon from '@material-ui/icons/AddToPhotosOutlined';
import VpnKeyOutlinedIcon from '@material-ui/icons/VpnKeyOutlined';

import './style.css'
import clsx from 'clsx';

export const MAIN_HEADER = 'MainHeader'
export const HEADER = 'Header'
export const SELECT = 'Select'
export const MULTI_SELECT = 'MultiSelect'
export const DUALLIST = 'DualList'
export const INPUT = 'Input'
export const POPUP_INPUT = 'PopupInput'
export const SWITCH = 'Switch'
export const CHECKBOX_ARRAY = 'CheckboxArray'
export const ICON_BUTTON = 'IconButton'
export const TEXT_AREA = 'TextArea'
export const BUTTON = 'Button'
export const MULTI_FORM = 'MultiForm'
export const SELECT_RADIO_TREE = 'SelectRadioTree'
export const SELECT_RADIO_TREE_GROUP = 'SelectRadioTreeGroup'
export const DATE_PICKER = 'DatePicker'
export const TIME_COUNTER = 'TimeCounter'
export const TIP = 'Tip'

const useStyles = makeStyles((theme) => ({
    formBtn: {
        display: 'flex',
        alignItems: 'center',
        textAlign: 'center',
        justifyContent: 'center',
        height: 35
    },
    formBtnMulti: {
        height: 55
    },
    fromHeaderLabel: {
        color: "white",
        display: 'flex',
        alignItems: 'center'
    },
    fromHorizontalFieldLabelContainer: {
        marginBottom: 5
    },
    fromHorizontalFieldText: {
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        marginRight: 3
    },
    formHorizontal: {
        width: '100%',
        marginLeft: 20
    },
    horizontalHelpTip: {
        display: 'flex',
        height: 55,
        paddingTop: '1.7rem'
    },
    tipMain: {
        listStyleType: 'none',
        padding: 0
    },
    tipBody: {
        fontSize: 13,
        marginTop: 5
    },
    tipText: {
        lineHeight: 1.2
    },
    tipContent: {
        marginTop: 9
    },
    formGroup: {
        flexDirection: 'column',
        alignContent: 'space-around'
    },
    mainHorizontalForm: {
        marginLeft: -13,
        width: '100%',
        marginTop: -10,
        marginBottom: -27
    }
}))

export const clearMultiForms = (forms, fields)=>{
    return forms.filter(form=>{
        return !fields.includes(form.field)
    })
}

export const findIndexs = (forms, fields)=>{
    let indexs = {}
    let isArray = Array.isArray(fields)
    forms.forEach((form, i)=>{
        if((isArray && fields.includes(form.field)) || form.field === fields)
        {
            indexs[form.field] = i+1
        }
    })
    return isArray ? indexs : indexs[fields]
}

export const fetchDataByField = (forms, fields) => {
    let data = {}
    for (const form of forms) {
        if (fields.includes(form.field)) {
            data[form.field] = form.value
        }
    }
    return data
}

/***
* Map values from form to field
* ***/
export const formattedData = (forms) => {
    let data = {};
    for (let i = 0; i < forms.length; i++) {
        let form = forms[i];
        if (form.field) {
            if (form.forms) {
                data[form.uuid] = {};
                let subForms = form.forms
                for (let j = 0; j < subForms.length; j++) {
                    let subForm = subForms[j];
                    if (subForm.field) {
                        data[form.uuid][subForm.field] = subForm.value;
                    }
                }
            }
            else {
                data[form.field] = form.value;
            }
        }
    }
    return data
}

const MexForms = (props) => {
    let forms = props.forms
    const classes = useStyles()
    const [error, setError] = React.useState(undefined)
    const orgInfo = useSelector(state => state.organizationInfo.data)
    const getIcon = (id) => {
        switch (id) {
            case 'delete':
                return <DeleteOutlineOutlinedIcon />
            case 'add':
                return <AddIcon />
            case 'add_mult':
                return <AddToPhotosOutlinedIcon />
            case 'browse':
                return <FolderOpenIcon />
            case 'clear':
                return <ClearIcon />
            case 'help':
                return <ContactSupportOutlinedIcon />
            case 'expand_less':
                return <ExpandLessIcon />
            case 'expand_more':
                return <ExpandMoreIcon />
            case 'vpn_key':
                return <VpnKeyOutlinedIcon />
            default:
                return id
        }
    }

    //Validate form before loading
    const initValidateRules = (form) => {
        let rules = form.rules ? form.rules : {};
        let disabled = rules.disabled ? rules.disabled : false;
        if (props.isUpdate) {
            disabled = form.update && (form.update.id || form.update.edit) ? disabled : true;
        }
        rules.disabled = disabled;
        form.rules = rules;
    }

    const isDisabled = (form) => {
        let disabled = false;
        if (form.rules) {
            let rules = form.rules;
            return rules.disabled === undefined ? false : rules.disabled;
        }
        return disabled;
    }

    const errorBanner = (form) => {
        setError(form.error)
        let element = document.getElementById(form.field)
        if (element) {
            element.style.scrollMargin = '10px';
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
        }
    }

    const validateRules = (form, valid) => {
        if (valid) {
            if (form.forms) {
                for (let i = 0; i < form.forms.length; i++) {
                    valid = validateRules(form.forms[i], valid)
                    if (!valid) {
                        break;
                    }
                }
            }
            else if (form.visible && !isDisabled(form)) {
                let rules = form.rules;
                if (rules) {
                    if (rules.required) {
                        if (form.formType === SELECT_RADIO_TREE) {
                            let dependentForm = forms[form.dependentData[0].index]
                            let values = dependentForm.value
                            if (dependentForm.value.includes('All')) {
                                values = cloneDeep(dependentForm.options)
                                values.splice(0, 1)
                            }
                            if (form.value === undefined || form.value.length !== values.length) {
                                form.error = rules.requiredMsg ? rules.requiredMsg : `${form.label} is mandatory`
                                errorBanner(form)
                                valid = false;

                            } else {
                                form.error = undefined
                                errorBanner(form)
                            }
                        }
                        else if (form.formType === SELECT_RADIO_TREE_GROUP) {
                            if ((form.value === undefined || Object.keys(form.options).length !== Object.keys(form.value).length)) {
                                form.error = rules.requiredMsg ? rules.requiredMsg : `${form.label} is mandatory`
                                errorBanner(form)
                                valid = false;
                            } else {
                                form.error = undefined
                                errorBanner(form)
                            }
                        }
                        else {
                            if (form.value === null || form.value === undefined || form.value.length === 0) {
                                form.error = rules.requiredMsg ? rules.requiredMsg : `${form.label ? form.label : 'Field'} is mandatory`
                                errorBanner(form)
                                valid = false;
                            }
                            else {
                                form.error = undefined
                                errorBanner(form)
                            }
                        }
                    }
                }
            }
        }
        if (valid && form.dataValidateFunc) {
            valid = form.dataValidateFunc(form)
            errorBanner(form)
        }
        return valid
    }

    const onSubmit = (form) => {
        let valid = true;
        if (form.validate) {
            for (let i = 0; i < props.forms.length; i++) {
                let form = forms[i]
                valid = form.visible ? validateRules(form, valid) : valid
                if (!valid) {
                    break;
                }
            }
        }
        if (valid && form.onClick) {
            form.onClick(formattedData(props.forms));
        }
        else if (props.reloadForms) {
            props.reloadForms()
        }
    }

    const onValueSelect = (form, value) => {
        form.value = value;
        if (props.onValueChange) {
            props.onValueChange(form)
        }

    }

    const loadInputForms = (form, required, disabled, tip = false) => {
        return (
            form.formType === INPUT ?
                <MexInput form={form} required={required} disabled={disabled} onChange={onValueSelect} tip={tip} /> :
                form.formType === POPUP_INPUT ?
                    <MexPopupInput form={form} required={required} disabled={disabled} onChange={onValueSelect} /> :
                    form.formType === TEXT_AREA ?
                        <MexTextArea form={form} required={required} disabled={disabled} onChange={onValueSelect} /> :
                        null
        )
    }

    const loadDropDownForms = (form, required, disabled) => {
        return (form.formType === SELECT ?
            <MexSelect form={form} forms={forms} required={required} disabled={disabled} onChange={onValueSelect} /> :
            form.formType === MULTI_SELECT ?
                <MexMultiSelect form={form} forms={forms} required={required} disabled={disabled} onChange={onValueSelect} /> :
                form.formType === DUALLIST ?
                    <MexDualList form={form} onChange={onValueSelect} /> : null)
    }

    const loadButton = (form, index) => {
        return (
            form.formType === ICON_BUTTON ?
                <IconButton style={form.style} key={index} tooltip={form.tooltip} onClick={(e) => { form.onClick(e, form) }} disabled={form.onClick === undefined}>{getIcon(form.icon)}</IconButton>
                :
                form.formType === BUTTON ?
                    <MexButton
                        form={form}
                        key={index}
                        onClick={(e) => { form.onClick(e, form) }} /> :
                    null
        )
    }

    const loadMainHeader = (index, form) => {
        return (
            <div style={{ width: '100%' }} key={index}>
                <h2 style={{ color: "white" }}>{form.label}</h2>
                <Divider />
            </div>
        )
    }


    const loadHeader = (index, form) => {
        form.id = { id: index }
        let subForms = form.forms
        return (
            <React.Fragment key={uniqueId() + '' + index}>
                <Grid.Row className={'formHeader-' + index} columns={2} style={{ height: 40 }}>
                    <Grid.Column width={15}>
                        <h3 className={classes.fromHeaderLabel}>{form.label}
                            {
                                subForms ? subForms.map((subForm, i) => {
                                    subForm.parent = { id: index, form: form }
                                    return loadButton(subForm, i)
                                }) : null
                            }
                        </h3>
                    </Grid.Column>
                    {
                        form.tip ?
                            <Grid.Column key={index} width={1}>
                                {/* @todo temp solution needs to be fixed */}
                                {showTip(form)}
                            </Grid.Column> :
                            null
                    }
                </Grid.Row>
                <Divider />
            </React.Fragment>
        )
    }

    const loadHorizontalForms = (parentId, forms, multi=true) => {

        let parentForm = props.forms[parentId];
        return forms.map((form, i) => {
            initValidateRules(form)
            let key = parentForm.uuid + '' + i
            let required = false;
            let disabled = false;
            form.id = { id: i }
            form.parent = { id: parentId, form: parentForm }
            if (form.rules) {
                let rules = form.rules;
                required = rules.required ? rules.required : false;
                disabled = rules.disabled ? rules.disabled : false;
            }
            return (
                form.visible ?
                    <Grid.Column width={form.width ? form.width : parentForm.width} key={key} style={{padding:`${multi ? 'default' : '0 1em 0 0'}`}}>
                        {
                            form.label ?
                                <div className={classes.fromHorizontalFieldLabelContainer}>
                                    <Tooltip title={form.label}>
                                        <div style={{ ...form.labelStyle }}>
                                            <p className={classes.fromHorizontalFieldText}>{`${form.label} ${required ? '*' : ''}`}</p>
                                        </div>
                                    </Tooltip>
                                </div> :
                                null
                        }
                        {
                            form.formType === INPUT || form.formType === TEXT_AREA || form.formType === POPUP_INPUT ?
                                loadInputForms(form, required, disabled, true) :
                                form.formType === SELECT ?
                                    loadDropDownForms(form, required, disabled) :
                                    form.formType === SWITCH ?
                                        <div style={{ marginTop: 5 }}><MexSwitch horizontal={true} form={form} onChange={onValueSelect} /></div> :
                                        form.formType === ICON_BUTTON || form.formType === BUTTON ?
                                            <div key={i} className={clsx(classes.formBtn, multi ? classes.formBtnMulti : '')}>{loadButton(form, i)}</div> :
                                            form.formType === TIP && form.tip ?
                                                <div key={i} className={classes.horizontalHelpTip}>{showTip(form)}</div> :
                                                null
                        }
                    </Grid.Column> : null
            )
        })
    }

    const showTip = (form) => {
        let tips = form.tip.split('\n')
        return (
            <Tooltip title={
                <ul className={classes.tipMain}>{tips.map((info, i) => {
                    const temp = info.split('</b>')
                    return (
                        <li key={i} className={classes.tipBody}>{temp.length === 2 ?
                            <React.Fragment>
                                <b>{`${temp[0]} `}</b>
                                <code className={classes.tipText} >{temp[1]}</code>
                            </React.Fragment> : <code className={classes.tipText}>{info}</code>}
                            <br />
                        </li>
                    )
                })}</ul>
            } aria-label="tip" className={classes.tipContent}>
                {getIcon('help')}
            </Tooltip>
        )
    }

    const checkRole = (form) => {
        if (form.roles) {
            let currentRole = redux_org.role(orgInfo)
            form.visible = form.roles.includes(currentRole)
        }
    }

    const loadForms = (index, form) => {
        form.id = { id: index }
        let required = false;
        let requiredColor = undefined
        let disabled = false;

        if (form.rules) {
            let rules = form.rules;
            disabled = rules.disabled ? rules.disabled : false;
            required = rules.required && !disabled ? rules.required : false;
            requiredColor = rules.requiredColor
        }
        return (
            form.field ?
                <Grid.Row columns={3} key={uniqueId() + '' + index} className={'formRow-' + index}>
                    <Grid.Column width={4} className='detail_item'>
                        {form.labelIcon ?
                            <MIB disabled={true}>{form.labelIcon}<sup style={{ color: requiredColor }}>{required ? ' *' : ''}</sup></MIB> :
                            <div style={form.labelStyle ? form.labelStyle : { marginTop: 8, color: '#CECECE' }}>{form.label}<sup style={{ color: requiredColor }}>{required ? ' *' : ''}</sup></div>}
                    </Grid.Column>
                    <Grid.Column width={11}>
                        {
                            form.forms ?
                                <Grid key={index} id={form.field} className={classes.mainHorizontalForm}>{loadHorizontalForms(index, form.forms, false)}</Grid> :
                                form.formType === SELECT || form.formType === MULTI_SELECT || form.formType === DUALLIST ?
                                    loadDropDownForms(form, required, disabled) :
                                    form.formType === SELECT_RADIO_TREE ?
                                        <MexSelectTree form={form} forms={forms} onChange={onValueSelect} /> :
                                        form.formType === SELECT_RADIO_TREE_GROUP ?
                                            <MexSelectTreeGroup form={form} forms={forms} onChange={onValueSelect} /> :
                                            form.formType === INPUT || form.formType === TEXT_AREA || form.formType === POPUP_INPUT ?
                                                loadInputForms(form, required, disabled) :
                                                form.formType === SWITCH ?
                                                    <MexSwitch form={form} onChange={onValueSelect} /> :
                                                    form.formType === DATE_PICKER ?
                                                        <MexDate form={form} onChange={onValueSelect} /> :
                                                        form.formType === TIME_COUNTER ?
                                                            <MexTimeCounter form={form} onChange={onValueSelect} /> :
                                                            null
                        }
                    </Grid.Column>
                    {
                        form.tip ?
                            <Grid.Column key={index} width={1}>
                                {showTip(form)}
                            </Grid.Column> :
                            null
                    }
                </Grid.Row> : null
        )
    }

    //hide form if condition fail
    const formVisibility = (form) => {
        let visible = form.visible
        //implement in 3.2 dualist causing issue
        // if (visible && props.isUpdate && !Boolean(form.forms) && form.rules?.disabled) {
        //     visible = form.value !== undefined
        // }
        return visible
    }

    return (
        forms ?
            <div style={props.style ? {} : { paddingTop: `${error ? 60 : 10}px`, backgroundColor: '#292c33', position: 'relative', }}>
                {error ?
                    <div style={props.style ?? { position: 'absolute', zIndex: 999, left: 0, right: 0, top: 0 }}>
                        <Alert severity="error">{error}</Alert>
                        {props.style ? null : <div><br /><br /></div>}
                    </div> : null}
                <Form>
                    <Form.Group widths="equal" className={classes.formGroup}>
                        <Grid columns={2}>
                            {forms.map((form, i) => {
                                const visible = formVisibility(form)
                                if (form.custom) {
                                    return (
                                        <React.Fragment key={i}>
                                            {form.custom()}
                                        </React.Fragment>
                                    )
                                }
                                else if (form.formType) {
                                    initValidateRules(form);
                                    checkRole(form)
                                    return (
                                        (form.advance === undefined || form.advance === true) && visible ?
                                            form.formType === MAIN_HEADER ?
                                                loadMainHeader(i, form) :
                                                form.formType === HEADER ?
                                                    loadHeader(i, form) :
                                                    form.formType === MULTI_FORM ?
                                                        form.forms ?
                                                            <Grid.Row key={i} id={form.field} className={classes.formHorizontal}>{loadHorizontalForms(i, form.forms)}</Grid.Row>
                                                            : null :
                                                        loadForms(i, form) :
                                            null
                                    )
                                }
                            })}
                        </Grid>
                    </Form.Group>
                    <Form.Group className={"submitButtonGroup orgButton"} id={"submitButtonGroup"} inline>
                        <Form.Group inline>
                            {forms.map((form, i) => {
                                return (form.formType === BUTTON ?
                                    <MexButton
                                        form={form}
                                        key={i}
                                        onClick={onSubmit} />
                                    : null)
                            })}
                        </Form.Group>
                    </Form.Group>
                </Form>
            </div> : null
    )
}
export default MexForms

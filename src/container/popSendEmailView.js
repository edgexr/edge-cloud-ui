import React from 'react'
import { Field, reduxForm } from 'redux-form'

const required = value => (value || typeof value === 'number' ? undefined : 'Required')
const maxLength = max => value =>
    value && value.length > max ? `Must be ${max} characters or less` : undefined
const maxLength15 = maxLength(15)
export const minLength = min => value =>
    value && value.length < min ? `Must be ${min} characters or more` : undefined
export const minLength2 = minLength(2)
const number = value =>
    value && isNaN(Number(value)) ? 'Must be a number' : undefined
const minValue = min => value =>
    value && value < min ? `Must be at least ${min}` : undefined
const minValue13 = minValue(13)
const email = value =>
    value && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value)
        ? 'Invalid email address'
        : undefined
const tooYoung = value =>
    value && value < 13
        ? 'You do not meet the minimum age requirement!'
        : undefined
const aol = value =>
    value && /.+@aol\.com/.test(value)
        ? 'Really? You still use AOL for your email?'
        : undefined
const alphaNumeric = value =>
    value && /[^a-zA-Z0-9 ]/i.test(value)
        ? 'Only alphanumeric characters'
        : undefined
export const phoneNumber = value =>
    value && !/^(0|[1-9][0-9]{9})$/i.test(value)
        ? 'Invalid phone number, must be 10 digits'
        : undefined

const renderField = ({
                         input,
                         label,
                         type,
                         meta: { touched, error, warning }
                     }) => (
    <div>
        <label>{label}</label>
        <div>
            <input {...input} placeholder={label} type={type} />
            {touched &&
            ((error && <span>{error}</span>) ||
                (warning && <span>{warning}</span>))}
        </div>
    </div>
)
const renderLabel = ({
                         input,
                         label,
                            value,
                         type,
                         meta: { touched, error, warning }
                     }) => (
    <div>
        <label>{label}</label>
        <div>
            {value}
        </div>
    </div>
)
const submit = () => {

}
class PopSendEmailView extends React.Component {
    componentWillReceiveProps(nextProps, nextContext) {
        if(nextProps.submitState !== this.props.submitState) {
            console.log('20191030 nextprops,.., ', nextProps.submitState, " : ", this.props.handleSubmit)
            document.getElementById('popSendEmailSubmit').click();
        }
        if(nextProps.clearState !== this.props.clearState) {
            //TODO 20191030 celar each field

        }
    }

    render() {
        let { handleSubmit, pristine, reset, submitting } = this.props;
        return (
            <form id={'eSendForm'} onSubmit={handleSubmit(submit)}>
                <Field
                    name="email"
                    type="email"
                    component={renderField}
                    label="Email"
                    validate={email}
                    warn={aol}
                />
                <Field
                    name="username"
                    type="text"
                    value={'support@mobiledgex.com'}
                    component={renderLabel}
                    label="Username"
                    validate={[required, maxLength15, minLength2]}
                    warn={alphaNumeric}
                />

                <Field
                    name="age"
                    type="number"
                    component={renderField}
                    label="Age"
                    validate={[required, number, minValue13]}
                    warn={tooYoung}
                />
                <Field
                    name="phone"
                    type="number"
                    component={renderField}
                    label="Phone number"
                    validate={[required, phoneNumber]}
                />
                <div style={{display:'none'}}>
                    <button id={'popSendEmailSubmit'} type="submit" disabled={submitting}>
                        Submit
                    </button>
                    <button type="button" disabled={pristine || submitting} onClick={reset}>
                        Clear Values
                    </button>
                </div>
            </form>
        )
    }

}

export default reduxForm({
    form: 'fieldLevelValidation' // a unique identifier for this form
})(PopSendEmailView)


/*
<form id={'eSendForm'} onSubmit={handleSubmit(submit)}>
                <Field
                    name="username"
                    type="text"
                    value={'support@mobiledgex.com'}
                    component={renderLabel}
                    label="Username"
                    validate={[required, maxLength15, minLength2]}
                    warn={alphaNumeric}
                />
                <Field
                    name="email"
                    type="email"
                    component={renderField}
                    label="Email"
                    validate={email}
                    warn={aol}
                />
                <Field
                    name="age"
                    type="number"
                    component={renderField}
                    label="Age"
                    validate={[required, number, minValue13]}
                    warn={tooYoung}
                />
                <Field
                    name="phone"
                    type="number"
                    component={renderField}
                    label="Phone number"
                    validate={[required, phoneNumber]}
                />
                <div style={{display:'none'}}>
                    <button id={'popSendEmailSubmit'} type="submit" disabled={submitting}>
                        Submit
                    </button>
                    <button type="button" disabled={pristine || submitting} onClick={reset}>
                        Clear Values
                    </button>
                </div>
            </form>
 */

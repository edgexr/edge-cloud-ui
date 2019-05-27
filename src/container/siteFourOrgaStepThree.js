import React, { Fragment } from "react";
import {Button, Form, Header, Message, List, Grid, Card} from "semantic-ui-react";
import { Field, reduxForm } from "redux-form";
import MaterialIcon from "../sites/siteFour_page_createOrga";
import './styles.css';

const validate = values => {
    const errors = {}
    if (!values.username) {
        errors.username = 'Required'
    } else if (values.username.length > 15) {
        errors.username = 'Must be 15 characters or less'
    }
    if (!values.email) {
        errors.email = 'Required'
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
        errors.email = 'Invalid email address'
    }
    if (!values.age) {
        errors.age = 'Required'
    } else if (isNaN(Number(values.age))) {
        errors.age = 'Must be a number'
    } else if (Number(values.age) < 18) {
        errors.age = 'Sorry, you must be at least 18 years old'
    }
    return errors
}
let type = 'Developer';
let role = 'Manage'
const roles =
    {
        Developer: [
            { Flavor:'View', ClusterFlavor:'View', Users:'Manage', Cloudlets:'View', ClusterInst:'Manage', Apps:'Manage', AppInst:'Manage'},
            { Flavor:'View', ClusterFlavor:'View', Users:'View', Cloudlets:'View', ClusterInst:'Manage', Apps:'Manage', AppInst:'Manage'},
            { Flavor:'View', ClusterFlavor:'View', Users:'View', Cloudlets:'View', ClusterInst:'View', Apps:'View', AppInst:'View'}
        ],
        Operator: [
            { Flavor:'disabled', ClusterFlavor:'disabled', Users:'Manage', Cloudlets:'Manage', ClusterInst:'disabled', Apps:'disabled', AppInst:'disabled'},
            { Flavor:'disabled', ClusterFlavor:'disabled', Users:'View', Cloudlets:'View', ClusterInst:'Manage', Apps:'disabled', AppInst:'disabled'},
            { Flavor:'disabled', ClusterFlavor:'disabled', Users:'View', Cloudlets:'View', ClusterInst:'disabled', Apps:'disabled', AppInst:'disabled'},
        ]
    }



const makeRoleList = (selectedType, i) => (
    <List divided verticalAlign='middle'>
        <List.Item>
            <List.Content>
                {
                    Object.keys(roles[selectedType][i]).map((key) => (
                        <List.Header><div style={{color:((roles[selectedType][i][key] === 'Manage')?'rgba(136,221,0,.9)':'rgba(255,255,255,.6)')}}>{ key +" : "+ (roles[selectedType][i][key]) }</div></List.Header>
                    ))
                }

            </List.Content>
        </List.Item>
    </List>
)

const items = [
    {
        header: 'Manager',
        description: `Leverage agile frameworks to provide a robust synopsis \n\r for high level overviews.`,
        meta: 'ROI: 30%',
    },
    {
        header: 'Contributor',
        description: 'Bring to the table win-win survival strategies to ensure proactive domination.',
        meta: 'ROI: 34%',
    },
    {
        header: 'Viewer',
        description:
            'Capitalise on low hanging fruit to identify a ballpark value added activity to beta test.',
        meta: 'ROI: 27%',
    },
]

const renderCheckbox = field => (
    <Form.Checkbox
        checked={!!field.input.value}
        name={field.input.name}
        label={field.label}
        onChange={(e, { checked }) => field.input.onChange(checked)}
    />
);

const renderRadio = field => (
    <Form.Radio
        checked={field.input.value === field.radioValue}
        label={field.label}
        name={field.input.name}
        onChange={(e, { checked }) => field.input.onChange(field.radioValue)}
    />
);

const renderSelect = field => (
    <Form.Select
        label={field.label}
        name={field.input.name}
        onChange={(e, { value }) => field.input.onChange(value)}
        options={field.options}
        placeholder={field.placeholder}
        value={field.input.value}
    />
);

const renderTextArea = field => (
    <Form.TextArea
        {...field.input}
        label={field.label}
        placeholder={field.placeholder}
    />
);
const renderInput = field => (
    <Form.Input
        {...field.input}
        type={field.type}
        label={field.label}
        placeholder={field.placeholder}
    />
);
// const typeOperator = (selected) => (
//
//     <Button.Group>
//         <Button positive={(selected === 'Developer')}>Developer</Button>
//         <Button.Or />
//         <Button positive={(selected === 'Operator')}>Operator</Button>
//     </Button.Group>
// )


// const makeCardContent = (item, i) => (
//     <Grid.Column>
//         <Card>
//             <Card.Content>
//                 <Card.Header>{item['header']}</Card.Header>
//                 <Card.Meta>{type}</Card.Meta>
//                 <Card.Description>
//                     {makeRoleList(type, i)}
//                 </Card.Description>
//                 <div style={{position:'absolute', top:'1em', right:'1em', width:'auto', display:'flex', alignItem:'right', justifyContent:'right' }}>
//                     <MaterialIcon icon={(item['header'] === role)?'check_circle':'check_circle_outline'} size={40} color={(item['header'] === role)?'rgba(136,221,0,.9)':'rgba(255,255,255,.6)'}/>
//                 </div>
//             </Card.Content>
//         </Card>
//     </Grid.Column>
// )
class SiteFourOrgaThree extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            
        };
       
    }
    changeOrg = () => {
        this.props.changeOrg()
    }

    render (){
        return (
            <Fragment>
                <Grid>
                    <Grid.Column width={11}>
                        <Form>
                            <Header>Congratulation! Start Right Now!</Header>
                                <div className='orgButton' style={{width:'100%'}}>
                                    <Button onClick={this.changeOrg} type='submit' positive style={{width:'100%'}}>Check your Organization</Button>
                                </div>
                                {/*<div className='orgButton' style={{width:'100%'}}>*/}
                                {/*    <Button type='submit' positive  style={{width:'100%'}}>Check User</Button>*/}
                                {/*</div>*/}
                        </Form>
                    </Grid.Column>
                    <Grid.Column width={5}>
                    </Grid.Column>
                </Grid>
            </Fragment>
        )
    } 
};

export default reduxForm({
    form: "orgaStepThree"
})(SiteFourOrgaThree);
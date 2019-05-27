import React, { Fragment } from "react";
import {Button, Form, Item, Message, Divider, Modal, List, Grid, Card, Dropdown, Input} from "semantic-ui-react";
import { Field, reduxForm } from "redux-form";
import MaterialIcon from "../sites/siteFour_page_createOrga";
import './styles.css';
import EditMap from '../libs/simpleMaps/with-react-motion/editMap';


const renderSelect = field => (
    <Form.Select
        name={field.input.name}
        //onChange={(e, { field }) => field.input.onChange(field.value)}
        //onChange={field.change}
        options={field.options}
        placeholder={field.placeholder}
        value={field.value}
        fluid
    />
);

const renderInput = field => (
    <div>
         <Form.Input
            {...field.input}
            type={field.type}
            placeholder={field.placeholder}
            fluid
        />
    </div>
   
);

const renderLocationInput = field => (
    <div>
         <Form.Input
            {...field.input}
            type={field.type}
            placeholder={field.placeholder}
            onChange={field.change}
            value={field.value}
            fluid
        />
    </div>
   
);

const registNewInput = (props) => {
    const { handleSubmit, data, dimmer, selected, regKeys,open, close, option, value, change, longLoc, latLoc, zoomIn, zoomOut, resetMap, locationLongLat, resetLocation, handleChangeLong, handleChangeLat, locationLong, locationLat } = props;

    
    return (
        <Fragment>
            <Form onSubmit={handleSubmit} className={"fieldForm"}>
                <Form.Group>
                    <Modal style={{width:1200}} open={open} onClose={close}>
                        <Modal.Header>Settings</Modal.Header>
                        <Modal.Content>
                            <div style={{display:'flex', flexDirection:'row', width:'100%'}}>
                                <Grid divided style={{width:800}}>
                                {
                                    (data.length > 0)?
                                    regKeys.map((key, i)=>(
                                        <Grid.Row columns={2}>
                                            <Grid.Column width={5} className='detail_item'>
                                                <div>{key}</div>
                                            </Grid.Column>
                                            <Grid.Column width={11}>
                                            {
                                                (key === 'Operator')?
                                                <Field component={renderSelect} placeholder='Select Operator' name='Operator' options={option[0]} value={value[0]} change={change[0]}/>
                                                : (key === 'DeveloperName')?
                                                <Field component={renderSelect} placeholder='Select Developer' name='Developer' options={option[1]} value={value[1]} change={change[1]}/>
                                                : (key === 'CloudletName')?
                                                <Field component={renderSelect} placeholder='Select Cloudlet' name='Cloudlet' options={option[2]} value={value[2]} change={change[2]}/>
                                                : (key === 'AppName')?
                                                <Field component={renderSelect} placeholder='Select AppName' name='AppName' options={option[3]} value={value[3]} change={change[3]}/>
                                                : (key === 'Version')?
                                                <Field component={renderSelect} placeholder='Select Version' name='Version' options={option[4]} value={value[4]} change={change[4]}/>
                                                : (key === 'ClusterInst')?
                                                <Field component={renderSelect} placeholder='Select ClusterInst' name='ClusterInst' options={option[5]} value={value[5]} change={change[5]}/>
                                                : (key === 'Type')?
                                                <Field component={renderSelect} placeholder='Select Type' name='Type' options={option[6]} value={value[6]} change={change[6]}/>
                                                : (key === 'Role')?
                                                <Field component={renderSelect} placeholder='Select Role' name='DeveloperName' options={option[7]} value={value[7]} change={change[7]}/>
                                                : (key === 'CloudletLocation')?
                                                <Grid>
                                                    <Grid.Row columns={2}>
                                                        <Grid.Column><span>Longitude</span><Field ref={longLoc} name='Longitude' component={renderLocationInput} placeholder={(dimmer === 'blurring')? '' : (selected[key]) ? selected[key].longitude : null } change={handleChangeLong} value={locationLong}  /></Grid.Column>
                                                        <Grid.Column><span>Latitude</span><Field ref={latLoc} name='Latitude' component={renderLocationInput} placeholder={(dimmer === 'blurring')? '' : (selected[key]) ? selected[key].latitude : null } change={handleChangeLat} value={locationLat}/></Grid.Column>
                                                    </Grid.Row>
                                                </Grid>
                                                :
                                                <Field component={renderInput} type="input" name={key} placeholder={(dimmer === 'blurring')? '' : selected[key] } />
                                            }
                                            </Grid.Column>
                                            <Divider vertical></Divider>
                                        </Grid.Row>
                                    ))
                                    :''
                                }
                                </Grid>
                                <Grid style={{marginTop:0, marginLeft:20, marginRight:10, width:'100%'}}>
                                    <Grid.Row style={{paddingTop:0, width:'100%'}}>
                                        <EditMap zoomIn={zoomIn} zoomOut={zoomOut} resetMap={resetMap} locationLongLat={locationLongLat} resetLocation={resetLocation} ></EditMap>
                                    </Grid.Row>
                                </Grid>
                            </div>
                        </Modal.Content>
                        <Modal.Actions>
                            <Button onClick={close}>
                                Cancel
                            </Button>
                            <Button
                                positive
                                icon='checkmark'
                                labelPosition='right'
                                content="Save"
                                type="submit"
                            />
                        </Modal.Actions>
                    </Modal>
                </Form.Group>
            </Form>
        </Fragment>
        
            
    );
};

export default reduxForm({
    form: "registNewListInput"
})(registNewInput);
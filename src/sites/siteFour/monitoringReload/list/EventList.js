import React from 'react'
import {  Collapse, Divider, List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core'
import * as dateUtil from '../../../../utils/date_util'
import './style.css'
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

class Events extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            expand: -1
        }
    }

    expandMenu = (id) => {
        this.setState(prevState => ({ expand: prevState.expand === id ? -1 : id }))
    }

    
    searchFilterValid = (mtags, filter)=>{
        let search  = filter.search
        let valid = []
        this.props.keys.map(key => {
            if (key.filter && mtags[key.serverField]) {
                valid.push(mtags[key.serverField].toLowerCase().includes(search.toLowerCase()))
            }
        })
        return valid.includes(true)
    }

    render() {
        const { header, eventData, filter, colors, keys} = this.props
        const { expand } = this.state
        return (
            <div className="event-list-main">
                <div align="left" className="event-list-header">
                    <h3>Events</h3>
                </div>
                <div style={{ height: 'calc(33vh - 0px)', overflow: 'auto' }}>
                    <List dense={false} >
                        {eventData.map((data, i) => {
                            let mtags = data['mtags']
                            return (
                                this.searchFilterValid(mtags, filter) ? <React.Fragment key={i}>
                                    <ListItem key={i} onClick={() => this.expandMenu(i)}>
                                        <ListItemIcon>
                                            <div style={{ width: 30, height: 30, borderRadius: 50, backgroundColor: colors[i], color: 'white', textAlign: 'center', padding: 6, fontWeight: 900 }}><b>{data['name'].charAt(0).toUpperCase()}</b></div>
                                        </ListItemIcon>
                                        <ListItemText id="switch-list-label-wifi" primary={data['name']} secondary={
                                            <React.Fragment>
                                                {this.props.header(mtags)}
                                                <br/>
                                                {dateUtil.time(dateUtil.FORMAT_FULL_DATE_TIME, data['timestamp'])}
                                            </React.Fragment>}  />
                                        {expand === i ? <ExpandLessIcon/> : <ExpandMoreIcon/>}
                                    </ListItem>
                                    <Collapse in={expand === i} timeout="auto" unmountOnExit>
                                        <List component="div" style={{ marginLeft: 60 }} dense={true}>
                                            {keys.map((key, j) => {
                                                let value = mtags[key.serverField]
                                                if (key.summary && value) {
                                                    return <ListItem key={j}><ListItemText primary={`${key.label}: ${value}`} /></ListItem>
                                                }
                                            })}
                                        </List>
                                    </Collapse>
                                    <Divider component="li" />
                                </React.Fragment> : null)
                        })}
                    </List>
                </div>
            </div>
        )
    }
}

export default Events
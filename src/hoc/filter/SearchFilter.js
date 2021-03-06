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
import { Input, InputAdornment } from '@material-ui/core'
import SearchIcon from '@material-ui/icons/SearchRounded';
import ClearAllOutlinedIcon from '@material-ui/icons/ClearAllOutlined';
import { withStyles } from '@material-ui/styles';

const styles = (theme) => ({
    inputRoot: {
        color: 'inherit',
    },
    inputInput: {
        transition: theme.transitions.create('width'),
        width: '0ch',
        height: 20,
        [theme.breakpoints.up('sm')]: {
            '&:focus': {
                width: '20ch',
            },
        },
    },
    searchAdorment: {
        fontSize: 17,
        pointerEvents: "none",
        cursor: 'pointer'
    },
    underline: {
        borderBottom: '1px solid red'
    }
});

class SearchFilter extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            filterText: '',
            focused: false
        }
        this.typingTimeout = undefined
    }

    onValueChange = (e) => {
        let value = e.target.value
        this.setState({ filterText: value })
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout)
            this.typingTimeout = undefined
        }
        this.typingTimeout = setTimeout(() => {
            if (this.props.insensitive) {
                value = value ? value.toLowerCase() : value
            }
            this.props.onFilter(value)
        }, 500)
    }

    onClear = () => {
        this.setState({ filterText: '' })
        this.props.onFilter('', true)
    }

    render() {
        const { focused } = this.state
        const { classes, compact, clear } = this.props;
        return (
            <Input
                size="small"
                fullWidth={!compact}
                value={this.state.filterText}
                onFocus={() => {
                    this.setState({ focused: true })
                }}
                onBlur={() => {
                    this.setState({ focused: false })
                }}
                disableUnderline={compact ? !focused : false}
                classes={compact ? {
                    root: classes.inputRoot,
                    input: classes.inputInput,
                } : { root: classes.inputRoot }}
                startAdornment={
                    <InputAdornment className={classes.searchAdorment} style={{ fontSize: 17 }} position="start">
                        <SearchIcon style={{ color: focused || compact ? 'rgba(118, 255, 3, 0.7)' : 'white' }} />
                    </InputAdornment>
                }
                endAdornment={
                    compact ? null : clear ? <InputAdornment position="end">
                        <ClearAllOutlinedIcon style={{ fontSize: 17, color: focused ? 'rgba(118, 255, 3, 0.7)' : 'white' }} onClick={this.onClear} />
                    </InputAdornment> : null
                }
                onChange={this.onValueChange}
                placeholder={'Search'} />
        )
    }
}

export default withStyles(styles)(SearchFilter);
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
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import yaml from 'react-syntax-highlighter/dist/esm/languages/hljs/yaml';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash';
import allyDark from 'react-syntax-highlighter/dist/esm/styles/hljs/a11y-dark';
import {copyData} from '../../utils/file_util'
import { Tooltip } from '@material-ui/core';
import { Icon } from '../mexui';

SyntaxHighlighter.registerLanguage('yaml', yaml);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('bash', bash);

export const syntaxHighLighter = (language, data) => (
    <SyntaxHighlighter language={language} style={allyDark} className='yamlDiv'>
        {data}
    </SyntaxHighlighter>
)

export const codeHighLighter = (data) => (
    <div style={{ width: '100%', backgroundColor: '#2B2B2B', borderRadius: 1, position: 'relative', color: '#E8E8E8' }}>
        <div style={{ overflowY: 'auto', maxHeight: 200 }}>
            <div style={{ width: '93%', padding: 12 }}>
                <code style={{ wordBreak: 'break-all' }}>{data}</code>
            </div>
        </div>
        <div style={{ position: 'absolute', right: 7, top: 0, bottom:0, display:'flex', alignItems:'center' }}>
            <Tooltip title={'copy'} aria-label="copy">
                <div style={{ cursor: 'pointer' }} onClick={(e) => copyData(data)}><Icon outlined={true} size={15}>file_copy</Icon></div>
            </Tooltip>
        </div>
    </div>
)
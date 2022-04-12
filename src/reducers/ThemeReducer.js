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

import {TOGGLE_THEME} from "../actions/ActionTypes";

const initialState = {
    themeType: 'dark'
};
export default function ThemeReducer(state = initialState, action) {
    switch (action.type) {
        case TOGGLE_THEME :
            return Object.assign({}, state, {
                themeType: action.themeType
            })
            break;
        default:
            return state
    }
}


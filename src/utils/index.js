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


//Grouping objects by a property
export const groupBy = (objectArray, property) => (
    objectArray.reduce((accumulator, obj) => {
        let key = obj[property];
        if(!accumulator[key]) {
            accumulator[key] = [];
        }
        accumulator[key].push(obj);
        return accumulator;
    },{})
)

export const groupByCompare = (objectArray, properties) => (
    objectArray.reduce((accumulator, obj) => {
        let key1 = obj[properties[0]];
        let key2 = obj[properties[1]];
        let key = [properties[0]]+':'+key1 + [properties[1]]+':'+key2
        if(!accumulator[key]) {
            accumulator[key] = [];
        }
        accumulator[key].push(obj);
        return accumulator;
    },{})
)

//Counting instances of values in an object
export const countedNames = (objectArray) => (
    objectArray.reduce((allNames, name) => {
        if (name in allNames) {
            allNames[name]++;
        }
        else {
            allNames[name] = 1;
        }
        return allNames;
    },{})
)


//Remove duplicate items in array
//let orderedArray = Array.from(new Set(myArray));
export const removeDuplicate = (objectArray) => (
    objectArray.reduce((accumulator, currentValue) => {
        if (accumulator.indexOf(currentValue) === -1) {
            accumulator.push(currentValue);
        }
        return accumulator
    }, [])
)

/*
var sum, avg = 0;

// dividing by 0 will return Infinity
// arr must contain at least 1 element to use reduce
if (arr.length)
{
    sum = arr.reduce(function(a, b) { return a + b; });
    avg = sum / arr.length;
}
* */
export const avg = (objectArray) => (
    (objectArray.reduce((accumulator, currentValue) => {
        return accumulator + currentValue;
    })) / objectArray.length
)


/*
var arr = [1,2,'xxx','yyy']
arr = arr.filter(function(e){ return e != 'xxx' });
arr  // [1, 2, "yyy"]
 */
export const filterDefine = (objectArray, values) => {
    values.map((filter) => {
        objectArray = objectArray.filter(function (e) {
            return e != filter
        })
    })
    return objectArray;

}
export const filterDeleteKey = (object, prop) => {
    const newObj = Object.keys(object).reduce((obj, key) => {
        if (key !== prop) {
            obj[key] = object[key]
        }
        return obj
    }, {})
    return newObj;
}
export const filterArrayDeleteKey = (object, prop) => {
    const newObj = Object.keys(object).reduce((obj, key) => {
        if (key !== prop) {
            obj[key] = object[key]
        }
        return obj
    }, [])
    return newObj;
}
export const filterDefineKey = (object, values) => {

    object.map((obj) => {
        values.map((filter) => {
            delete obj[filter]
        })
    })

    return object;

}
export const filterSearch = (data, searchValue, searchType) => {
    let searchArr = []

    data.filter((item) => {

        let itemCheck = item[searchType].toLowerCase();
        let searchValueCheck = searchValue.toLowerCase();

        if (itemCheck.indexOf(searchValueCheck) !== -1) {

            searchArr.push(item);
        }
    })
    return searchArr;

}


export const getFindIndex = (items, key, value) => {
    items.filter((item) => {
        if (item[key] === value) {
            items = item
        }
    })
    return items;

}

export const getTodayDate = () => {
    let d = Date.now();
    d = new Date(d);
    let year = d.getFullYear();
    let month = (d.getMonth() + 1)
    let day = d.getDate()
    d = year + "-" + month + "-" + day;
    return d;
}

export const formatDate = (d) => {
    d = new Date(d);
    let year = d.getFullYear();
    let month = (d.getMonth() + 1)
    let day = d.getDate()
    d = year + "-" + month + "-" + day;
    return d;
}


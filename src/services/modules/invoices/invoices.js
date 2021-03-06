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

import { perpetual } from '../../../helper/constant'
import { endpoint } from '../..';

export const keys = () => ([
    { field: 'uuid', serverField: 'uid', label: 'ID' },
    { field: 'number', serverField: 'number', label: 'Number', visible: true },
    { field: 'issueDate', serverField: 'issue_date', label: 'Issued At', visible: true },
    { field: 'dueDate', serverField: 'due_date', label: 'Due Date', visible: true },
    { field: 'firstname', serverField: 'customer#OS#first_name', label: 'First Name', detailView: false },
    { field: 'lastname', serverField: 'customer#OS#last_name', label: 'Last Name', detailView: false },
    { field: 'name', label: 'Name', visible: true },
    { field: 'status', serverField: 'status', label: 'Status', visible: false },
    { field: 'collectionMethod', serverField: 'collection_method', label: 'Collection Method', visible: false },
    { field: 'paidAmount', serverField: 'paid_amount', label: 'Paid Amount', visible: false, detailView: false },
    { field: 'discountAmount', serverField: 'discount_amount', label: 'Discount Amount', visible: false, detailView: false },
    { field: 'subtotalAmount', serverField: 'subtotal_amount', label: 'Subtotal Amount', visible: false, detailView: false },
    { field: 'taxAmount', serverField: 'tax_amount', label: 'Tax Amount', visible: false, detailView: false },
    { field: 'totalAmount', serverField: 'total_amount', label: 'Total Amount', visible: true },
    { field: 'dueAmount', serverField: 'due_amount', label: 'Amount Due', visible: true },
    { field: 'items', serverField: 'line_items', label: 'Item', visible: false, dataType: perpetual.TYPE_JSON, detailView: false },
    { field: 'customer', serverField: 'customer', label: 'Customer', visible: false, dataType: perpetual.TYPE_JSON, detailView: false },
    { field: 'seller', serverField: 'seller', label: 'Seller', visible: false, dataType: perpetual.TYPE_JSON, detailView: false }
])

export const showInvoices = (self, data) => {
    let requestData = data
    return { method: endpoint.INVOICE_BILLING, data: requestData, keys: keys() }
}
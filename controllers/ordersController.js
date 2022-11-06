const prisma = require('../utils/prismaDB');
const functions = require('../utils/functions');
const file = require('../utils/readAndWriteFiles')
const hana = require('../utils/hana')
const sendEmail = require('../utils/email')

const requestPage = async (req,res) => {
    if(req.session.loggedin)
    {
        prisma.getDataLocal(req.session.whsCode,req.session.employeeNO).then(results => {
            const start = async () => {
                const value = await file.getlabel()
                const data = {
                    results,
                    username : req.session.username,
                    whsCode : req.session.whsCode,
                    value
                }
                res.render('request',{data})
            }
            start()
        }).catch(err => {
            res.render('error')
        });
    }else{
        res.redirect('/Login')
    }
}

const requestReceiptPage = async (req,res) => {
    if(req.session.loggedin)
    {
        prisma.getGenCodeLocal().then(results => {
            res.render('reqReceipt',{data:results})
        }).catch(err => {
            res.render('error')
        });
    }else{
        res.redirect('/Login')
    }
}

const deliveryPage = async (req,res) => {
    if(req.session.loggedin)
    {
        res.render('deliveryTransfer')
    }else{
        res.redirect('/Login')
    }
}

const printPage = async (req,res) => {
    if(req.session.loggedin)
    {
        prisma.getAllTransferGencodes().then(results => {
            res.render('print',{data:results})
        }).catch(err => {
            res.render('error')
        });
    }else{
        res.redirect('/Login')
    }
}

const printReport = async(req,res) => {
    if(req.session.loggedin)
    {
        const {page,genCode,type} = req.params
        let records;
        let from;
        let to;
        let mappedData;
        if(page == "request"){
            records = await prisma.findAllSent(genCode)
            let match = await file.getMatchingFile()
            match = functions.codeToName(match)
            from = match[`${records[0].Warehousefrom}`]
            to = records[0].WhsName
            mappedData = records.map((rec,index) => {
                return {
                    no:parseInt(index) + 1,
                    ItemCode:rec.ItemCode,
                    ItemName:rec.ItemName,
                    CodeBars:rec.CodeBars,
                    WarehouseFrom:rec.Warehousefrom,
                    WarehouseTo:rec.WhsCode,
                    Order:rec.Order,
                    BuyUnitMsr:rec.BuyUnitMsr,
                    GenCode:rec.GenCode,
                }
            })
            if(type == "table"){
                res.render('partials/printTransfer',{results:mappedData,page})
            }else{
                res.send({results:mappedData,page,from,to})
            }
        }else{
            records = await prisma.findAllDelivered(genCode)
            if(records){
                from = req.session.warehouseName
                to = records[0].WhsName
                mappedData = records.map((rec,index) => {
                    return {
                        no:parseInt(index) + 1,
                        ItemCode:rec.ItemCode,
                        ItemName:rec.ItemName,
                        CodeBars:rec.CodeBars,
                        WarehouseFrom:rec.WhsCode,
                        WarehouseTo:rec.WarehouseTo,
                        Order:rec.Order,
                        BuyUnitMsr:rec.BuyUnitMsr,
                        GenCode:rec.GenCode,
                    }
                })
                if(type == "table"){
                    res.render('partials/printTransfer',{results:mappedData,page})
                }else{
                    res.send({results:mappedData,page,from,to})
                }
            }else{
                res.send('noData')
            }
        }
    }else{
        res.redirect('/Login')
    }
}

const requestReceiptTable = async (req,res) => {
    if(req.session.loggedin)
    {
        prisma.getSavedLocal().then(results => {
            res.render('receiptGenCode',{data:results})
        }).catch(err => {
            res.render('error')
        });
    }else{
        res.redirect('/Login')
    }
}

const requestService = async (req,res) => {
    if(req.session.loggedin)
    {
        res.render('partials/chooseService',{page:"request"})
    }else{
        res.redirect('/Login')
    }
}

const transferService = async (req,res) => {
    if(req.session.loggedin)
    {
        res.render('partials/chooseService',{page:"transfer"})
    }else{
        res.redirect('/Login')
    }
}

const chooseFrom = async (req,res) => {
    if(req.session.loggedin)
    {
        hana.warehouseMatch(req.session.whsCode)
        .then((str) => {
            if(str){
                const start = async() => {
                    const arr = functions.configWarehouses(str)
                    let match = await file.getMatchingFile()
                    match = functions.codeToName(match)
                    const data = {
                        results:arr,
                        match 
                    }
                    res.render('partials/whsFrom',{data})
                }
                start()
            }else{
                res.render('partials/error')
            }
        }).catch(err => {
            res.render('partials/error')
        });
    }else{
        res.redirect('/Login')
    }
}

const genCodeOrderStatus = async(req,res) => { 
    const {genCode} = req.params
    if(req.session.loggedin)
    {
        const results = await functions.getOpenRequest(genCode)
        if(results != "error"){
            if(results.length > 0){
                functions.upsertRequestOrders(results)
                .then(() => {
                    res.send('open')
                })
                .catch(() => {
                    res.send('error')
                })
            }else{
                res.send('close')
            }
        }else{
            res.send('error')
        }
    }else{
        res.redirect('/Login')
    }
}

const syncReqReceiptData = async(req,res) => {
    const {genCode} = req.params
    if(req.session.loggedin)
    {
        const data = await prisma.findAllReceiptSaved(genCode)
        if(data){
            const mappedData = data.map(rec => {
                return {
                    id:rec.id,
                    ItemCode:rec.ItemCode,
                    ItemName:rec.ItemName,
                    ListNum:rec.ListNum,
                    ListName:rec.ListName,
                    OnHand:rec.OnHand,
                    MinStock:rec.MinStock,
                    MaxStock:rec.MaxStock,
                    Price:rec.Price,
                    BuyUnitMsr:rec.BuyUnitMsr,
                    WhsCode:rec.WhsCode,
                    WhsName:rec.WhsName,
                    CodeBars:rec.CodeBars,
                    ConvFactor:rec.ConvFactor,
                    Warehousefrom:rec.Warehousefrom,
                    OrderRequest:rec.Order,
                    Difference:rec.Order,
                    GenCode:rec.GenCode,
                }
            })
            prisma.deleteAllInReqReceipt().then(() => {
                prisma.createTable(mappedData).then(() => {
                    res.send('done')
                }).catch(() => {
                    res.send('error')
                })
            }).catch(() => {
                res.send('error')
            })
        }else{
            res.send('error')
        }
        
    }else{
        res.redirect('/Login')
    }
}

const saveChoose = async(req,res) => {
    const {from} = req.params
    if(req.session.loggedin)
    {
        req.session.from = from
        res.send('done')
    }else{
        res.redirect('/Login')
    }
}

const transferPage = async (req,res) => {
    if(req.session.loggedin)
    {
        prisma.getDataLocal(req.session.whsCode,req.session.employeeNO).then(results => {
            const start = async() => {
                const data = {
                    results,
                    username : req.session.username,
                    whsCode : req.session.whsCode,
                    from : req.session.from,
                    genCode : results[0].GenCode
                }
                res.render('transfer',{data})
            }
            start()
        }).catch(err => {
            res.render('error')
        });
    }else{
        res.redirect('/Login')
    }
}

const saveOrderValue = async (req,res) => {
    try{
        const {id,value} = req.params
        prisma.update(id,value)
        .then(() => {
            res.send('done')
        }).catch(() => {
            res.send('error')
        })
    }catch(err){
        res.send('error')
    }
}

const saveReceiptValue = async (req,res) => {
    try{
        const {id,value,diffValue} = req.params
        prisma.updateReqReceipt(id,value,diffValue)
        .then(() => {
            res.send('done')
        }).catch(() => {
            res.send('error')
        })
    }catch(err){
        res.send('error')
    }
}

const submit = async (req,res) =>{
    const {page,note} = req.params
    try{
        let records
        let managerEmail = null
        if(page == 'request'){
            records = await prisma.findOrderList()
        }else if(page == 'transfer'){
            records = await prisma.findOrderListTransfer()
            managerEmail = req.session.managerEmail
        }else if(page == 'receipt'){
            records = await prisma.findOrderReceiptList()
        }
        if(records.length > 0){
            functions.sendRequestOrder(records,req.session.username,page,note)
            .then(() => {
                if(req.session.allowed == '1'){
                    req.session.reload(function(err) {
                        req.session.allowed = "0"
                        res.send('done')
                    })
                    functions.closeAllowReq(req.session.username)
                }else{
                    res.send('done')
                }
                if(page == 'transfer'){
                    const subject = 'تحويل بين مستودعات'
                    let text = `هنالك طلب تحويل من مستودع ${records[0].Warehousefrom} الى مستودع ${records[0].WhsCode}`
                    text += '\n'
                    text += `رقم التحويل ${records[0].GenCode}`
                    sendEmail(text,subject,managerEmail)
                }
                const start = async() => {
                    const no = await file.getPostNo('./postNumber.txt')
                    file.updateGenCode(no,'./postNumber.txt')
                    const transfer = async () => {
                        records = await prisma.findOrderList()
                        prisma.transferToHes(records,req.session.whsCode)
                    }
                    transfer()
                }
                if(page != 'receipt'){
                    start()
                }else if(page == 'receipt'){
                    prisma.deleteAllInReqReceipt().then(() => {
                        const genCode = records[0].GenCode
                        new Promise((resolve,reject) => {
                            const length = records.length
                            const arr = []
                            records.forEach(rec => {
                                const id = rec.id
                                const order = rec.Order
                                prisma.updateinHestoricalOrder(id,order,arr)
                                .then(() => {
                                    if(arr.length == length){
                                        resolve()
                                    }
                                })
                                .catch(() => {
                                    reject()
                                })
                            })
                        })
                        .then(() => {
                            prisma.rejectRequests(genCode)
                        }).catch(() => {
                            console.log('could not save')
                        })
                    })
                }
            })
            .catch(err => {
                res.send('error')
            })
        }else{
            res.send('no data sent')
        }
    }catch(err){
        res.send('error')
    }
}

const deliverSubmit = async (req,res) =>{
    try{
        let records = await prisma.findOrderReceiptList()
        if(records.length > 0){
            functions.submitDeliverToSQL(records)
            .then(() => {
                res.send('done')
                prisma.deleteAllInReqReceipt()
                const mappedResults = records.map(rec => {
                    return {
                        ItemCode: rec.ItemCode,
                        ItemName: rec.ItemName,
                        CodeBars: rec.CodeBars,
                        WhsCode: rec.Warehousefrom,
                        WarehouseTo: rec.WhsCode,
                        WhsName: rec.WhsName,
                        Order: rec.Order,
                        OrderRequest: rec.OrderRequest,
                        BuyUnitMsr: rec.BuyUnitMsr,
                        GenCode: rec.GenCode,
                    }
                })
                prisma.addToDeliverHis(mappedResults)
            })
            .catch(() => {
                res.send('error')
            })
        }else{
            res.send('no data sent')
        }
    }catch(err){
        res.send('error')
    }
}

const report = async (req,res) => {
    const {page} = req.params
    try{
        if(page == 'request'){
            let records = await prisma.findOrderList()
            res.render('partials/report',{results:records,page:"report"})
        }else if(page == 'transfer'){
            let records = await prisma.findOrderListTransfer()
            res.render('partials/report',{results:records,page:"allreport"})
        }else if(page == 'receipt'){
            let records = await prisma.findOrderReceiptList()
            res.render('partials/reqRecReport',{results:records,page})
        }else if(page == 'deliver'){
            let records = await prisma.findOrderReceiptList()
            res.render('partials/reqRecReport',{results:records,page})
        }
    }catch(err){
        res.send('error')
    }
}

const allReport = async (req,res) => {
    const {page,genCode} = req.params
    try{
        if(page != 'receipt' && page != 'deliver'){
            let genCode = await file.previousGetGenCode(req.session.whsCode,'./postNumber.txt',req.session.employeeNO)
            let records = await prisma.findAllSent(genCode)
            res.render('partials/report',{results:records,page:"allreport"})
        }else if(page == 'receipt'){
            let records = await prisma.findAllReceipt(genCode)
            res.render('partials/reqRecAllReport',{results:records,page})
        }else if(page == 'deliver'){
            let records = await prisma.findAllDelivered(genCode)
            res.render('partials/reqRecAllReport',{results:records,page})
        }
    }catch(err){
        res.send('error')
    }
}

const changeFrom = async(req,res) => {
    try{
        let {value} = req.query
        if(value){
            let match = await file.getMatchingFile()
            match = functions.nameToCode(match)
            value = match[value]
        }else{
            value = null
        }
        prisma.updateFrom(value)
        .then(() => {
            res.send('done')
        }).catch(() => {
            res.send('error')
        })
    }catch(err){
        res.send('error')
    }

}

const createSuggest = async (req,res) => {
    const rows = await prisma.findAllRequest()
    const length = rows.length
    const arr = []
    rows.forEach(rec => {
        const min = parseFloat(rec.MinStock)
        const onHand = parseFloat(rec.OnHand)
        const order = parseFloat(rec.Order)
        const id = rec.id
        const convFac = parseFloat(rec.ConvFactor)
        const suggQty = parseFloat(rec.SuggQty)
        if((order == 0) && ((min - onHand) > 0)){
            let value = suggQty
            if(value > 0){
                let diff;
                let diff1;
                if(suggQty % convFac == 0){
                    value = suggQty
                }else{
                    // diff = parseFloat(convFac) - parseFloat(suggQty % convFac)
                    // diff = parseFloat(diff) / parseFloat(suggQty)
                    // diff = parseInt(diff * 100)
                    // if(diff > 20){
                    //     diff1 = parseFloat(suggQty % convFac)
                    //     diff1 = parseFloat(diff1) / parseFloat(suggQty)
                    //     diff1 = parseInt(diff1 * 100)
                    //     if(diff1 > 20){
                    //         value = parseFloat(suggQty) + (parseFloat(convFac) - parseFloat(suggQty % convFac))
                    //     }else{
                    //         value = parseFloat(suggQty) - parseFloat(suggQty % convFac)
                    //     }
                    // }else{
                    //     value = parseFloat(suggQty) + (parseFloat(convFac) - parseFloat(suggQty % convFac))
                    // }
                    value = parseFloat(suggQty) + (parseFloat(convFac) - parseFloat(suggQty % convFac))
                    
                }
                if((value + onHand) < min){
                    value = parseFloat(min) + (parseFloat(convFac) - parseFloat(min % convFac))
                }
                new Promise((resolve,reject) => {
                    prisma.updateSuggest(id,value,true)
                    .then(() => {
                        resolve('done')
                    }).catch(() => {
                        reject()
                    })
                }).then(() => {
                    arr.push('added')
                    if(arr.length == length){
                        res.send('done')
                    }
                }).catch(() => {
                    arr.push('added')
                    if(arr.length == length){
                        res.send('error')
                    }
                })
            }else{
                arr.push('added')
                if(arr.length == length){
                    res.send('done')
                }
            }
        }else{
            arr.push('added')
            if(arr.length == length){
                res.send('done')
            }
        }
    })
}

const removeSuggest = async (req,res) => {
    const rows = await prisma.findAllRequest()
    const length = rows.length
    const arr = []
    rows.forEach(rec => {
        const suggest = rec.Suggest
        const id = rec.id
        if(suggest){
            new Promise((resolve,reject) => {
                prisma.updateSuggest(id,0,false)
                .then(() => {
                    resolve('done')
                }).catch(() => {
                    reject()
                })
            }).then(() => {
                arr.push('added')
                if(arr.length == length){
                    res.send('done')
                }
            }).catch(() => {
                arr.push('added')
                if(arr.length == length){
                    res.send('error')
                }
            })
        }else{
            arr.push('added')
            if(arr.length == length){
                res.send('done')
            }
        }
    })
}

const label = async(req,res) => {
    const { value } = req.params
    file.addLabel(value)
    res.send('done')
}

const sync = async (req,res) => {
    if(req.session.loggedin)
    {
        const {genCode} = req.params
        new Promise((resolve,reject) => {
            const warehousefrom = req.session.whsCode
            const results = functions.getTransferReq(genCode,warehousefrom)
            if(results){
                resolve(results)
            }else{
                reject()
            }
        }).then((results) => {
            if(results.length > 0){
                const start = async () => {
                    const mappedData = results.map(rec => {
                        return {
                            id:rec.ID,
                            ItemCode:rec.ItemCode,
                            ItemName:rec.ItemName,
                            ListNum:rec.ListNum,
                            ListName:rec.ListName,
                            OnHand:rec.OnHand,
                            MinStock:rec.MinStock,
                            MaxStock:rec.MaxStock,
                            Price:rec.Price,
                            BuyUnitMsr:rec.BuyUnitMsr,
                            WhsCode:rec.WhsCode,
                            WhsName:rec.WhsName,
                            CodeBars:rec.CodeBars,
                            ConvFactor:rec.ConvFactor,
                            Warehousefrom:rec.warehousefrom,
                            OrderRequest:rec.QtyOrders,
                            Difference:rec.QtyOrders,
                            GenCode:rec.GenCode,
                        }
                    })
                    const data = await functions.saveTransferReq(mappedData)
                    if(data){
                        res.render('partials/reqRecTable',{info:{results:mappedData,page:"deliver"}})
                    }else{
                        res.send('error')
                    }
                }
                start()
            }else{
                res.send('not found')
            }
        }).catch(() => {
            res.send('error')
        })
    }else{
        res.redirect('/Login')
    }
}

const sendRequestEmail = async (req,res) => {
    try{
        const whsCode = req.session.whsCode
        const username = req.session.username   
        const text = `الرجاء السماح للفرع رقم ${whsCode} و المستخدم ${username} بعمل طلبية في غير وقتها المحدد`
        const subject = `طلب عمل طلبية في غير الوقت المحدد`
        const toEmail = req.session.supplierEmail
        sendEmail(text,subject,toEmail)
        .then(() => {
            res.send('done')
        })
        .catch(() => {
            res.send('error')
        })
    }catch(err){
        res.send('error')
    }
}

const checkAllowStatus = async (req,res) => {
    try{
        functions.checkStuts(req.session.username)
        .then((msg) => {
            if(msg == 'notAllowed'){
                req.session.allowed = '0'
            }else{
                req.session.allowed = '1'
            }
            res.send(msg)
        })
        .catch(() => {
            res.send('error')
        })
    }catch(err){
        res.send('error')
    }
}

module.exports = {
    requestPage,
    saveOrderValue,
    submit,
    report,
    allReport,
    transferPage,
    changeFrom,
    createSuggest,
    removeSuggest,
    label,
    chooseFrom,
    saveChoose,
    transferService,
    requestService,
    requestReceiptPage,
    syncReqReceiptData,
    requestReceiptTable,
    saveReceiptValue,
    genCodeOrderStatus,
    deliveryPage,
    sync,
    deliverSubmit,
    printPage,
    printReport,
    sendRequestEmail,
    checkAllowStatus
}
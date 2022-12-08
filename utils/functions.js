require('dotenv').config();
const sql = require('./sql');
const hana = require('./hana');
const prisma = require('./prismaDB');
const file = require('./readAndWriteFiles');
const exportToexcel = require('./excel')

// enviroment variables
const USERS_TABLE = process.env.USERS_TABLE
const USERS_WHS_TABLE = process.env.USERS_WHS_TABLE
const REQUSET_TRANSFER_TABLE = process.env.REQUSET_TRANSFER_TABLE
const RECEIVING_PO_TABLE= process.env.RECEIVING_PO_TABLE
const COUNTING_REQUEST_TABLE= process.env.COUNTING_REQUEST_TABLE
const SQL_REQUEST_TRANSFER_PROCEDURE = process.env.SQL_REQUEST_TRANSFER_PROCEDURE
const SQL_RECEIVING_RETURNPO_PROCEDURE = process.env.SQL_RECEIVING_RETURNPO_PROCEDURE
const SQL_RECEIVINGPO_PROCEDURE = process.env.SQL_RECEIVINGPO_PROCEDURE
const MAIN_WHAREHOUSE =process.env.MAIN_WHAREHOUSE
const CONSUMABLE_WAREHOUSE =process.env.CONSUMABLE_WAREHOUSE

const toggleRequestButton = (requestDay,requestHour) => {
    const loggedDay = new Date().toLocaleString('en-us', {  weekday: 'long' });
    const loggedHour = new Date().getHours();
    let requestBtu = false
    if((loggedDay.toLowerCase() == requestDay.toLowerCase()) && (loggedHour < requestHour)){
        requestBtu = true
    }
    return requestBtu;
}

const getUser = async (username,password) => {
    try{
        const pool = await sql.getSQL();
        if(pool){
            const user = await pool.request().query(`select * from ${USERS_TABLE} where Username = '${username}' and Password = '${password}'`)
            .then(result => {
                pool.close();
                return result.recordset;
            })
            return user
        }else{
            return
        }
    }catch(err){
        return
    }
}

const getWhs = async (username) => {
    try{
        const pool = await sql.getSQL();
        if(pool){
            const whsCode = await pool.request().query(`select * from ${USERS_WHS_TABLE} where Username = '${username}'`)
            .then(result => {
                pool.close();
                return result.recordset;
            })
            return whsCode
        }else{
            return
        }
    }catch(err){
        return
    }
}

const getTransferReq = async (genCode,warehousefrom) => {
    try{
        const pool = await sql.getSQL();
        if(pool){
            const user = await pool.request().query(`select * from ${REQUSET_TRANSFER_TABLE} where GenCode = '${genCode}' and SAP_Procces = 2 and warehousefrom = '${warehousefrom}'`)
            .then(result => {
                pool.close();
                return result.recordset;
            })
            return user
        }else{
            return
        }
    }catch(err){
        return
    }
}

const getAndSaveData = async (whs,page,value,employeeNO) => {
    try{
        return new Promise((resolve,reject) => {
            let msg
            if(page == "goRequest"){
                msg = hana.getItems(whs).then(results => {
                    return prisma.createRecords(results,page,employeeNO)
                })
            }else if(page == "goTransfer"){
                const start = async () => {
                    let match = await file.getMatchingFile()
                    match = nameToCode(match)
                    const from = match[value]
                    return hana.getItemsTransfer(whs,from).then(results => {
                        return prisma.createRecords(results,page,employeeNO)
                    })
                }
                msg = start()
            }else if(page == "goReturn"){
                msg = hana.getItems(whs).then(results => {
                    return prisma.createReturnRecords(results)
                })
            }
            resolve(msg)
        }).then((msg) => {
            return msg
        }).catch(err => {
            return
        })
    }catch(err){
        return
    } 
}

const sendRequestOrder = async (records,userName,page,note,count) => {
    return new Promise((resolve,reject) => {
        const start = async () => {
            try{
                const pool = await sql.getSQL()
                if(pool){
                    const length = records.length
                    const arr = []
                    records.forEach(rec => {
                        if(rec.Status == 'pending'){
                            if(page != "receipt"){
                                startTransaction(pool,rec,userName,arr,length,page,note,count)
                                .then(() => {
                                    resolve()
                                })
                                .catch((err) => {
                                    reject()
                                })
                            }else{
                                if(parseInt(rec.Difference) != 0){
                                    startTransaction(pool,rec,userName,arr,length,page,note,count)
                                    .then(() => {
                                        resolve()
                                    })
                                    .catch((err) => {
                                        reject()
                                    })
                                }else{
                                    prisma.updateReqRecStatus(rec.id,arr)
                                    .then(() => {
                                        if(arr.length == length){
                                            resolve();
                                        }
                                    })
                                    .catch(err => {
                                        reject()
                                    })
                                }
                            }
                        }else{
                            arr.push('added')
                            if(arr.length == length){
                                resolve();
                            }
                        }
                    })
                }else{
                    reject()
                }
            }catch(err){
                reject()
            }
        }
        start()
    })
}

const sendReturnItems = async (records,userName,note,genCode) => {
    return new Promise((resolve,reject) => {
        const start = async () => {
            try{
                const pool = await sql.getSQL()
                if(pool){
                    const length = records.length
                    const arr = []
                    records.forEach(rec => {
                        if(rec.Status == 'pending'){
                            startReturnTransaction(pool,rec,userName,arr,length,note,genCode)
                            .then(() => {
                                resolve()
                            })
                            .catch((err) => {
                                reject()
                            })
                        }else{
                            arr.push('added')
                            if(arr.length == length){
                                resolve();
                            }
                        }
                    })
                }else{
                    reject()
                }
            }catch(err){
                reject()
            }
        }
        start()
    })
}

const startTransaction = async (pool,rec,userName,arr,length,page,note,count) => {
    const transaction = await sql.getTransaction(pool);
    return new Promise((resolve,reject) => {
        transaction.begin((err) => {
            if(err){
                console.log(err)
                reject()
            }
            let warehousefrom;
            let warehouseTo;
            let order;
            let sapProcess;
            if(page == "transfer"){
                warehousefrom = rec.Warehousefrom
                warehouseTo = rec.WhsCode
                order = rec.Order
                sapProcess = 3
            }else if(page == "request"){
                warehousefrom = rec.ListName == 'Consumable'? CONSUMABLE_WAREHOUSE : MAIN_WHAREHOUSE;
                warehouseTo = rec.WhsCode
                order = rec.Order
                sapProcess = 5
            }else if(page == "receipt"){
                warehousefrom = rec.WhsCode
                warehouseTo = rec.ListName == 'Consumable'? CONSUMABLE_WAREHOUSE : MAIN_WHAREHOUSE;
                order = rec.Difference
                sapProcess = 5
            }
            pool.request()
            .input("ItemCode",rec.ItemCode)
            .input("ItemName",rec.ItemName)
            .input("ListNum",rec.ListNum)
            .input("ListName",rec.ListName)
            .input("OnHand",rec.OnHand)
            .input("MinStock",rec.MinStock)
            .input("MaxStock",rec.MaxStock)
            .input("Price",rec.Price)
            .input("BuyUnitMsr",rec.BuyUnitMsr)
            .input("WhsCode",warehouseTo)
            .input("WhsName",rec.WhsName)
            .input("CodeBars",rec.CodeBars)
            .input("ConvFactor",rec.ConvFactor)
            .input("QtyOrders",order)
            .input("GenCode",rec.GenCode)
            .input("createdAt",rec.createdAt)
            .input("warehousefrom",warehousefrom)
            .input("UserName",userName)
            .input("Note",note)
            .input("SAP_Procces",sapProcess)
            .input("CountRows",count)
            .execute(SQL_REQUEST_TRANSFER_PROCEDURE,(err,result) => {
                if(err){
                    console.log('excute',err)
                    reject()
                }
                transaction.commit((err) => {
                    if(err){
                        console.log('transaction error : ',err)
                        reject()
                    }
                    console.log("Transaction committed.");
                    checkSavedInRequestSql(rec.ItemCode,rec.GenCode,pool)
                    .then(() => {
                        if(page != "receipt"){
                            prisma.updateStatus(rec.id,arr)
                            .then(() => {
                                if(arr.length == length){
                                    pool.close();
                                    resolve();
                                }
                            })
                            .catch(err => {
                                reject()
                            })
                        }else{
                            prisma.updateReqRecStatus(rec.id,arr)
                            .then(() => {
                                if(arr.length == length){
                                    pool.close();
                                    resolve();
                                }
                            })
                            .catch(err => {
                                reject()
                            })
                        }
                    })
                    .catch(() => {
                        reject()
                    })
                });
            })
        })
    })
}

const checkSavedInRequestSql = async(itemCode,genCode,pool) => {
    const queryStatment = `select * from ${REQUSET_TRANSFER_TABLE} where ItemCode = '${itemCode}' and GenCode = '${genCode}'`
    return new Promise((resolve,reject) => {
        pool.request().query(queryStatment)
        .then(result => {
            if(result.recordset.length > 0){
                resolve()
            }else{
                reject()
            }
        })
    })
}

const startReturnTransaction = async (pool,rec,userName,arr,length,note,genCode) => {
    const transaction = await sql.getTransaction(pool);
    return new Promise((resolve,reject) => {
        transaction.begin((err) => {
            if(err){
                console.log(err)
                reject()
            }
            const po = rec.DocNum != 0 ? rec.DocNum.toString() : null
            pool.request()
            .input("Linenum",0)
            .input("ItemCode",rec.ItemCode)
            .input("Dscription",rec.ItemName)
            .input("CodeBars",rec.CodeBars)
            .input("WhsCode",rec.WhsCode)
            .input("CardName",null)
            .input("CardCode",null)
            .input("DocNum",genCode)
            .input("PurchaseNo",po)
            .input("UgpName",rec.BuyUnitMsr)
            .input("OpenQty",0)
            .input("RecQty",rec.Order)
            .input("userName",userName)
            .input("Note",note)
            .execute(SQL_RECEIVING_RETURNPO_PROCEDURE,(err,result) => {
                if(err){
                    console.log('excute',err)
                    reject()
                }
                transaction.commit((err) => {
                    if(err){
                        console.log('transaction error : ',err)
                        reject()
                    }
                    console.log("Transaction committed.");
                    prisma.updateReturnStatus(rec.id,arr)
                    .then(() => {
                        if(arr.length == length){
                            pool.close();
                            resolve();
                        }
                    })
                    .catch(err => {
                        reject()
                    })
                });
            })
        })
    })
}

const configWarehouses = (str) => {
    const whsSTR = str
    return whsSTR.split(',')
}

const codeToName = (list) => {
    const newList = JSON.parse(list)
    const group = newList.group
    let data = {}
    for(let i = 0; i < group.length; i++){
        const arr = group[i]
        data[arr[0]] = arr[1]
    }
    return data
}

const nameToCode = (list) => {
    const newList = JSON.parse(list)
    const group = newList.group
    let data = {}
    for(let i = 0; i < group.length; i++){
        const arr = group[i]
        data[arr[1]] = arr[0]
    }
    return data
}

const syncPOData = async (results) => {
    try{
        return new Promise((resolve,reject) => {
            const start = async () => {
                let skip = false
                const pervious = await prisma.getAllSavedPOs()
                if(pervious.length > 0){
                    if(pervious[0].DocNum == results[0].DocNum){
                        resolve(pervious)
                        skip = true
                    }
                }
                if(!skip){
                    const saved = await prisma.saveAndGetPOs(results)
                    if(saved){
                        resolve(saved)
                    }else{
                        reject()
                    }
                }
            }
            start()
        }).catch(err => {
            return 'error'
        })
    }catch(err){
        return 'error'
    } 
}

const sendPOtoSQL = async (records,userName,gencode) => {
    return new Promise((resolve,reject) => {
        const start = async () => {
            try{
                const pool = await sql.getSQL()
                if(pool){
                    const length = records.length
                    const arr = []
                    records.forEach(rec => {
                        if((rec.Status == 'pending') && (rec.Order > 0)){
                            startPOtransaction(pool,rec,userName,arr,length,gencode)
                            .then(() => {
                                resolve()
                            })
                            .catch((err) => {
                                reject()
                            })
                        }else{
                            arr.push('added')
                            if(arr.length == length){
                                resolve();
                            }
                        }
                    })
                }else{
                    reject()
                }
            }catch(err){
                reject()
            }
        }
        start()
    })
}

const startPOtransaction = async (pool,rec,userName,arr,length,gencode) => {
    const transaction = await sql.getTransaction(pool);
    return new Promise((resolve,reject) => {
        transaction.begin((err) => {
            if(err){
                console.log(err)
                reject()
            }
            pool.request()
            .input("Linenum",rec.LineNum)
            .input("ItemCode",rec.ItemCode)
            .input("Dscription",rec.Dscription)
            .input("CodeBars",rec.CodeBars)
            .input("WhsCode",rec.WhsCode)
            .input("CardName",rec.CardName)
            .input("CardCode",rec.CardCode)
            .input("DocNum",rec.DocNum)
            .input("UgpName",rec.UgpName)
            .input("OpenQty",rec.OpenQty)
            .input("RecQty",rec.Order)
            .input("username",userName)
            .input("RefDocNo",gencode)
            .execute(SQL_RECEIVINGPO_PROCEDURE,(err,result) => {
                if(err){
                    console.log('excute',err)
                    reject()
                }
                transaction.commit((err) => {
                    if(err){
                        console.log('transaction error : ',err)
                        reject()
                    }
                    console.log("Transaction committed.");
                    checkSavedInPOtSql(rec.ItemCode,rec.DocNum,pool)
                    .then(() => {
                        prisma.updatePOstatus(rec.id,arr)
                        .then(() => {
                            if(arr.length == length){
                                pool.close();
                                resolve();
                            }
                        })
                        .catch(err => {
                            reject()
                        })
                    })
                    .catch(() => {
                        reject()
                    })
                });
            })
        })
    })
}

const checkSavedInPOtSql = async(itemCode,docNum,pool) => {
    const queryStatment = `select * from ${RECEIVING_PO_TABLE} where ItemCode = '${itemCode}' and DocNum = '${docNum}' and SAP_Processed = 0`
    return new Promise((resolve,reject) => {
        pool.request().query(queryStatment)
        .then(result => {
            if(result.recordset.length > 0){
                resolve()
            }else{
                reject()
            }
        })
    })
}

const checkOpenDays = (days) => {
    const arabToNum = {
        "الاحد" : 0,
        "الاثنين" : 1,
        "الثلاثاء" : 2,
        "الاربعاء" : 3,
        "الخميس" : 4,
        "الجمعة" : 5,
        "السبت" : 6,
    }
    const arr = days.split('-')
    let open = false
    arr.forEach((day) => {
        const num = arabToNum[day]
        const today = new Date().getDay()
        if(num == today){
            open = true
        }
    })
    return open
}

const saveTransferReq = async(results) => {
    try{
        return new Promise((resolve,reject) => {
            const start = async () => {
                let skip = false
                const pervious = await prisma.getAllSavedDelivery()
                if(pervious.length > 0){
                    if(pervious[0].GenCode == results[0].GenCode){
                        resolve(pervious)
                        skip = true
                    }
                }
                if(!skip){
                    const saved = await prisma.saveAndGetDelivery(results)
                    if(saved){
                        resolve(saved)
                    }else{
                        reject()
                    }
                }
            }
            start()
        }).catch(err => {
            return 'error'
        })
    }catch(err){
        return 'error'
    } 
}

const submitDeliverToSQL = async(records) => {
    return new Promise((resolve,reject) => {
        const start = async() => {
            const pool = await sql.getSQL()
            if(pool){
                const length = records.length
                const arr = []
                records.forEach(rec => {
                    if(rec.Status == 'pending'){
                        sendDeliverRec(rec,arr,pool,length)
                        .then(() => {
                            if(arr.length == length){
                                resolve()
                            }
                        })
                        .catch(() => {
                            reject()
                        })
                    }else{
                        arr.push('added')
                        if(arr.length == length){
                            resolve()
                        }
                    }
                })
            }else{
                reject()
            }
        }
        start()
    })
}

const sendDeliverRec = async(rec,arr,pool,length) => {
    return new Promise((resolve,reject) => {
        let queryStatment;
        if(parseInt(rec.Order) != 0){
            queryStatment = `update ${REQUSET_TRANSFER_TABLE} set QtyOrders = ${rec.Order} , SAP_Procces = 0 where ID = ${rec.id}`
        }else{
            queryStatment = `delete from ${REQUSET_TRANSFER_TABLE} where ID = ${rec.id}`
        }
        try{
            pool.request().query(queryStatment)
            .then(result => {
                if(result.rowsAffected.length > 0){
                    console.log('table record updated')
                    prisma.updateReqRecStatus(rec.id,arr)
                    .then(() => {
                        if(arr.length == length){
                            pool.close();
                            resolve();
                        }
                    })
                    .catch(err => {
                        reject()
                    })
                }else{
                    reject()
                    console.log(result.rowsAffected)
                }
            })
        }catch(err){
            reject()
        }
    })

}

const submitCountToSQL = async(records) => {
    return new Promise((resolve,reject) => {
        const start = async() => {
            const pool = await sql.getSQL()
            if(pool){
                const length = records.length
                const arr = []
                records.forEach(rec => {
                    if(rec.Status == 'pending'){
                        sendCountRec(rec,arr,pool,length)
                        .then(() => {
                            if(arr.length == length){
                                arr.push('resolved')
                                pool.close();
                                resolve();
                            }
                        })
                        .catch(() => {
                            reject()
                        })
                    }else{
                        arr.push('added')
                        if(arr.length == length){
                            arr.push('resolved')
                            resolve()
                        }
                    }
                })
            }else{
                reject()
            }
        }
        start()
    })
}

const sendCountRec = async(rec,arr,pool,length) => {
    return new Promise((resolve,reject) => {
        let queryStatment = `update ${COUNTING_REQUEST_TABLE} set Qnty = ${rec.Qnty} , SAP_Processed = 0 where ID = ${rec.id}`;
        try{
            pool.request().query(queryStatment)
            .then(result => {
                if(result.rowsAffected.length > 0){
                    console.log('table record updated')
                    prisma.deleteCountStatus(rec.id,arr)
                    .then(() => {
                        resolve()
                    })
                    .catch(() => {
                        reject()
                    })
                }else{
                    console.log(result.rowsAffected)
                    reject()
                }
            })
        }catch(err){
            reject()
        }
    })

}

const checkStuts = async(username) => {
    return new Promise((resolve,reject) => {
        const start = async () => {
            try{
                const pool = await sql.getSQL()
                if(pool){
                    await pool.request().query(`select * from ${USERS_WHS_TABLE} where Username = '${username}'`)
                    .then(result => {
                        const allowed = result.recordset[0].Allowed
                        if(allowed == '0'){
                            resolve('notAllowed')
                        }else{
                            resolve('allowed')
                        }
                        pool.close();
                    })
                }else{
                    reject()
                }
            }catch(err){
                reject()
            }
        }
        start()
    })
}

const getOpenRequest = async(genCode) => {
    return hana.getRequestReceipt(genCode)
    .then((results) => {
        return results
    })
    .catch(() => {
        return 'error'
    })
}

const upsertRequestOrders = async(results) => {
    const length = results.length;
    const arr = []
    return new Promise((resolve,reject) => {
        results.forEach(rec => {
            prisma.upsertAllRec(rec,arr)
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
}

const closeAllowReq = async(username) => {
    try{
        const pool = await sql.getSQL()
        if(pool){
            await pool.request().query(`update ${USERS_WHS_TABLE} set Allowed = '0' where Username = '${username}'`)
            .then(result => {
                pool.close();
            })
        }
    }catch(err){
        console.log(err)
    }
}

const syncCountRequest = async(whs,username,date) => {
    return new Promise((resolve,reject) => {
        try{
            const start = async() => {
                const pool = await sql.getSQL()
                if(pool){
                    await pool.request().query(`select * from ${COUNTING_REQUEST_TABLE} where WhsCode = '${whs}' and Username = '${username}' and SAP_Processed = 2 and CountingDate <= '${date}'`)
                    .then(result => {
                        pool.close();
                        if(result.recordset.length > 0){
                            const start = async() => {
                                const msg = await saveCountRequest(result.recordset)
                                if(msg != 'error'){
                                    const names = await prisma.getCountNames()
                                    resolve(names.length)
                                }else{
                                    reject()
                                }
                            }
                            start()
                        }else{
                            resolve(0)
                        }
                    })
                }else{
                    reject()
                }
            }
            start()
        }catch(err){
            reject()
        }
    })
}

const updateCountNo = async(username,counts) => {
    return new Promise((resolve,reject) => {
        try{
            const start = async() => {
                const pool = await sql.getSQL()
                if(pool){
                    await pool.request().query(`update ${USERS_WHS_TABLE} set CountingAvailable = '${counts}' where Username = '${username}'`)
                    .then(result => {
                        pool.close();
                        if(result.rowsAffected.length > 0){
                            resolve()
                        }else{
                            reject()
                        }
                    })
                }else{
                    reject()
                }
            }
            start()
        }catch(err){
            reject()
        }
    })
}

const saveCountRequest = async(result) => {
    const mappedData = result.map((rec) => {
        return {
            id:rec.ID,
            CountingName:rec.CountingName,
            CountingDate:rec.CountingDate,
            ItemCode:rec.ItemCode,
            ItemName:rec.ItemName,
            BuyUnitMsr:rec.UnitMsr,
            WhsCode:rec.WhsCode,
            CodeBars:rec.CodeBars,
            Note:rec.Note,
            Price:rec.Price,
            ScaleType:rec.ScaleType,
        }
    })
    return prisma.createAllcountReq(mappedData)
}

const getCountingAvailable = async(counts,message,whs,username) => {
    if(parseInt(counts) == 0){
        return counts
    }else{
        let date = new Date()
        date = date.toISOString().split('T')[0]
        date = new Date(date).toISOString();
        return await syncCountRequest(whs,username,date)
                .then((no) => {
                    return no
                })
                .catch(() => {
                    message.msg = 'error'
                    return counts
                })
    }
}

const exportReqToExcel = async () => {
    let records = await prisma.findOrderList()
    if(records.length > 0){
        const mappedeRecords = records.map(rec => {
            return [
                rec.ItemCode,
                rec.ItemName,
                rec.CodeBars,
                rec.AvgDaily.toString(),
                rec.OnHand.toString(),
                rec.MinStock.toString(),
                rec.MaxStock.toString(),
                rec.Order.toString(),
                rec.BuyUnitMsr
            ]
        })
        const sheetName = records[0].GenCode
        const columnsName = ['Item Code','Item Name','Barcode','Avg. Daily Sale','On Hand','Min','Max','Order','Unit']
        const status = exportToexcel(mappedeRecords,columnsName,sheetName)
        if(status){
            return 'done'
        }else{
            return 'error'
        }
    }else{
        return 'noData'
    }
}

module.exports = {
    toggleRequestButton,
    getUser,
    getWhs,
    getAndSaveData,
    sendRequestOrder,
    configWarehouses,
    codeToName,
    nameToCode,
    syncPOData,
    sendPOtoSQL,
    sendReturnItems,
    checkOpenDays,
    getTransferReq,
    saveTransferReq,
    submitDeliverToSQL,
    checkStuts,
    getOpenRequest,
    upsertRequestOrders,
    closeAllowReq,
    getCountingAvailable,
    submitCountToSQL,
    updateCountNo,
    exportReqToExcel
}
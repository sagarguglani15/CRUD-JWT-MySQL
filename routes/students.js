var express = require('express');
var router = express.Router();
mysql = require('./../Data/mysql')

router.get('/', async (req, res)=>{
    try {
        try{
            let promise = mysql.executeQuery(`select  * from students where username = "${req.user.username}"`)
            await promise.then( function (result){
                return res.json({
                    "Students Details": result[0]
                })
            })
        } catch (err) {
            return res.json({"Data":null, "Error": err})
        }

    } catch (err) {
        res.json({
            'Data':null,
            'Error': err
        })
    }
})

router.delete('/', async (req, res)=>{
    try {
        var curr_student
        try{
            let promise = mysql.executeQuery(`select  * from students where username = "${req.user.username}"`)
            await promise.then( function (result){
                curr_student = result[0]
            })
        } catch (err) {
            return res.json({"Data":null, "Error": err})
        }

        if(!curr_student){
            return res.json({"Error": "Access token expired"})
        }

        let deregister
        try{
            let promise = mysql.executeQuery(`select  course_id from enrollement where student = "${req.user.username}"`)
            await promise.then( function (result){
                deregister = result
            })
        } catch (err) {
            return res.json({"Data":null, "Error": err})
        }

        try{
            mysql.executeQuery(` delete from enrollement where student = "${curr_student.username}" `)
        } catch (err) {
            return res.json({"Data":null, "Error": err})
        }

        deregister.forEach(course=>{
            try{
                mysql.executeQuery(` update courses set availableSlots = availableSlots + 1 where id = ${course.course_id}`)
            } catch (err) {
                return res.json({"Data":null, "Error": err})
            }
        })

        try{
            mysql.executeQuery(` delete from students where username = "${curr_student.username}" `)
        } catch (err) {
            return res.json({"Data":null, "Error": err})
        }

        return res.json({ "Status": 'Student Deleted Successfully' })
    } catch (err) {
        res.json({
            'Data':null,
            'Error': err
        })
    }
})

module.exports = router;

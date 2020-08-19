var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken')
mysql = require('./../Data/mysql')

const myKey='YehMeriKeyHai'

const authenticate = (req, res, next)=>{
    try{
        var token = req.headers.authorization
        if (!token){
            res.json({ "Error": 'Token value required as Authorization under header!'})
        }else{
            token=token.split(' ')[1]
            if (token){
                jwt.verify(token, myKey, (err, user)=>{
                    if (err){
                        res.json({ "Error": 'Invalid Access Token'})
                    }else{
                        req.user = user
                        next()
                    }
                })
            }else{
                res.json({ "Error": ' Access Token not found! '})
            }
        }
    }catch(err){
        res.json({
            'Data': null,
            'Error': err
        })
    }

}

router.get('/', async (req,res)=>{
    try{
        let promise = mysql.executeQuery(`select  * from courses`)
        await promise.then( function (result){
            return res.json({
                "Courses Details": result
            })
        })
    } catch (err) {
        return res.json({"Data":null, "Error": err})
    }

})

router.get('/:id', async (req,res)=>{
    try {
        let course

        try{
            let promise = mysql.executeQuery(`select  * from courses where id = ${req.params.id}`)
            await promise.then( function (result){
                course = result[0]
            })
        } catch (err) {
            return res.json({"Data":null, "Error": err})
        }

        if(!course){
            return res.json({"Error": "No course found with this id !"})
        }

        try{
            let promise = mysql.executeQuery(`select  student from enrollement where course_id = ${course.id}`)
            await promise.then( function (result){
                course['enrolledStudents'] = result
            })
        } catch (err) {
            return res.json({"Data":null, "Error": err})
        }

        return res.json({"Course Details": course})
    } catch (err) {
        res.json({
            'Data':null,
            'Error': err
        })
    }
})

router.post('/', async (req,res)=>{
    try {
        let course_id
        try{
            let promise = mysql.executeQuery(`select  max(id) from courses`)
            await promise.then( function (result){
                course_id = result[0]['max(id)']
            })
        } catch (err) {
            return res.json({"Data":null, "Error": err})
        }

        if (course_id==null){
            course_id = 0
        }else{
            course_id+=1
        }

        if (!req.body.name){
            return res.json({ "Error": ' "name" is a required attribute'})
        }
        if (!req.body.availableSlots){
            return res.json({ "Error": ' "availableSlots" is a required attribute'})
        }

        if (parseInt(req.body.availableSlots)){
            if (parseInt(req.body.availableSlots) < 0){
                return res.json({ "Error": "Available Slots must be a natural number" })
            }
        }else{
            return res.json({ "Error": "Not a valid natural number !" })
        }
        try{
            mysql.executeQuery(`insert into courses values( "${course_id}", "${req.body.name}", ${parseInt(req.body.availableSlots)})`)
        } catch (err) {
            return res.json({"Data":null, "Error": err})
        }
        res.json({"Success":"Course Added"})
    } catch (err) {
        res.json({
            'Data':null,
            'Error': err
        })
    }
})

router.post('/:id/enroll', authenticate, async (req,res)=>{
    try {
        let curr_course

        try{
            let promise = mysql.executeQuery(`select  * from courses where id = ${req.params.id}`)
            await promise.then( function (result){
                curr_course = result[0]
            })
        } catch (err) {
            return res.json({"Data":null, "Error": err})
        }

        if (!curr_course) {
            return res.json({ "Error": 'No course found for this id!'})
        }

        try{
            let promise = mysql.executeQuery(`select  * from enrollement where course_id = ${curr_course.id} and student = "${req.user.username}"`)
            await promise.then( function (result){
                if (result[0]){
                    throw 'Student is already enrolled in this course !'
                }
            })
        } catch (err) {
            return res.json({"Data":null, "Error": err})
        }

        try{
            let promise = mysql.executeQuery(`select availableSlots from courses where id = ${curr_course.id}`)
            await promise.then( function (result){
                if (result[0]['availableSlots']<1){
                    throw 'No slots available for this course !'
                }
            })
        } catch (err) {
            return res.json({"Data":null, "Error": err})
        }

        try{
            mysql.executeQuery(`insert into enrollement values( ${curr_course.id}, "${req.user.username}")`)
        } catch (err) {
            return res.json({"Data":null, "Error": err})
        }

        try{
            mysql.executeQuery(`update courses set availableSlots = availableSlots - 1 where id = ${curr_course.id}`)
        } catch (err) {
            return res.json({"Data":null, "Error": err})
        }

        return res.json({"Success": "Student enrolled successfully !"})

    } catch (err) {
        res.json({
            'Data':null,
            'Error': err
        })
    }
})

router.put('/:id/deregister', authenticate, async (req,res)=>{
    try {

        let curr_course
        try{
            let promise = mysql.executeQuery(`select  * from courses where id = ${req.params.id}`)
            await promise.then( function (result){
                curr_course = result[0]
            })
        } catch (err) {
            return res.json({"Data":null, "Error": err})
        }

        if (!curr_course) {
            return res.json({ "Error": 'No course found for this id!'})
        }


        try{
            let promise = mysql.executeQuery(`select  * from enrollement where course_id = ${req.params.id} and student = "${req.user.username}"`)
            await promise.then( function (result){
                if (!result[0]){
                    throw 'No student with this id is enrolled in this course !'
                }
            })
        } catch (err) {
            return res.json({"Data":null, "Error": err})
        }

        try{
            mysql.executeQuery(` delete from enrollement where student = "${req.user.username}" and course_id = ${req.params.id}`)
        } catch (err) {
            return res.json({"Data":null, "Error": err})
        }

        try{
            mysql.executeQuery(` update courses set availableSlots = availableSlots + 1 where id = ${req.params.id}`)
        } catch (err) {
            return res.json({"Data":null, "Error": err})
        }

        return res.json({"Success":'Student unregistered successfully !'})
    } catch (err) {
        res.json({
            'Data':null,
            'Error': err
        })
    }
})


module.exports = router;
const ErrorResponse = require("../utils/errorResponse")

const errorHandler = (err,req,res,next)=> {
    let error = {...err}

    error.message = err.message

    console.log(err)

    //Mongoose bad objectId 
    if(err.name === 'CastError'){
        const message = `Reasource not found`
        error = new ErrorResponse(message,404)
    }

    //Mongoose Duplicate values
    if(err.code === 11000){
        const message = `Duplicate fields entered`
        error = new ErrorResponse(message,400)
    }

    //Mongoos Empty fields that are required
    if(err.name==='ValidationError'){
        const message = Object.values(err.errors).map(val => val.message)
        error = new ErrorResponse(message,400)
    }

    console.log(err.name)

    res.status(error.statusCode || 500)
    .json(
        {
            success:false,
            error:error.message || 'server error'
        }
    )

}
module.exports=errorHandler;
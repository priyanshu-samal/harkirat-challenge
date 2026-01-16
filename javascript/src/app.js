import express from express
import cookieParser from cookie-parser
import authRoutes from ('./routes/routes')






const app=express()
app.use(express.json())
app.use(express.cookieParser())



app.get("/",(req,res)=>{
    res.send("Auth is running")
})


app.use('/api/',authRoutes)
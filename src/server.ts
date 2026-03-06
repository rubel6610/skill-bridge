import app from "./app";
import { prisma } from "./lib/prisma";

const port = process.env.PORT || 5000;

async function main(){
    try {
        await prisma.$connect();
        console.log("connected to the db successfully");

        app.listen(port, ()=>{
            console.log(`server running on htttp://localhost:${port}`);
        })
    } catch (error) {
        console.log("an error occurred",error);
        await prisma.$disconnect()
    }
}

main()
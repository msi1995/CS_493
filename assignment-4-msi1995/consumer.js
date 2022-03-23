const amqp = require ('amqplib');

const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost';
const rabbitmqURL = `amqp://${rabbitmqHost}`


async function main(){
    try{
        const connection = await amqp.connect(rabbitmqURL);
        const channel = await connection.createChannel();
        await channel.assertQueue('echo');

        channel.consume('echo', msg => {
            if(msg){
                console.log("== New message consumed:", msg.content.toString())
            }
            channel.ack(msg);
        });
    } catch(err) {
        console.error(err);
    }
}

main();
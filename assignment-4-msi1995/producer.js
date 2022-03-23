const amqp = require ('amqplib');

const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost';
const rabbitmqURL = `amqp://${rabbitmqHost}`


async function main(){
    try{
        const connection = await amqp.connect(rabbitmqURL);
        const channel = await connection.createChannel();
        await channel.assertQueue('echo');

        const sentence = "The quick brown fox jumps over the lazy dog";
        sentence.split(' ').forEach(word =>{
            channel.sendToQueue('echo', Buffer.from(word));
        });

        setTimeout(() => connection.close(), 500)
    } catch(err) {
        console.error(err);
    }
}

main();
const sizeOf = require('image-size')
const { connectToDB } = require('./lib/mongo');
const {connectToRabbitMQ, getChannel} = require('./lib/rabbitmq');
const { getImageDownloadStreamById, updateImageDimensionsById, resizePhoto } = require('./models/photo')
connectToDB(async () => {
    await connectToRabbitMQ('images');
    const channel = getChannel();
    channel.consume('images', msg =>{
        const id = msg.content.toString();
        const imageChunks = [];
        getImageDownloadStreamById(id)
            .on('data', chunk => {
                imageChunks.push(chunk);
            })
            .on('end', async () => {
                const dimensions = sizeOf(Buffer.concat(imageChunks));
                console.log("==Computed dimensions:",  dimensions);
                const result = await updateImageDimensionsById(id, dimensions);
                console.log("==updated result:", result);
                const image = Buffer.concat(imageChunks)
                const largestDimension = Math.max(dimensions.height, dimensions.width)
                console.log("==largest dimension:", largestDimension);
                resizePhoto(image, largestDimension, id)
            })
            channel.ack(msg);
    });
});

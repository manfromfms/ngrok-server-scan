const { spawn } = require('child_process')

console.clear()
console.log('\x1b[35mMAIN PROCESS\x1b[0m starting index.js script')

var child

var lastRestartOnError = -1

spawnNewChild = () => {
    child = spawn('node', ['./src/index.js'])

    child.stdout.on('data', data => {
        console.log(`\x1b[33mINDEX.JS\x1b[0m ${data}`)
    })
    
    child.on('exit', function (code) {
        if(code == 123) {
            console.log('\x1b[35mMAIN PROCESS\x1b[0m Asked for restart')
            spawnNewChild()
        } else if(code == 1) {
            var timeDelta = Date.now() - lastRestartOnError
            lastRestartOnError = Date.now()
            if(timeDelta >= 60000) {
                console.log(`\x1b[35mMAIN PROCESS\x1b[0m Cought an error. Restarting index.js: previous error restart was ${timeDelta}ms ago`)

                const config = require('./src/config.json')
                const { MessageEmbed, WebhookClient } = require('discord.js')
                const webhookId = config.whid
                const webhookToken = config.whToken
                const webhookClient = new WebhookClient({ id: webhookId, token: webhookToken })

                const embed = new MessageEmbed()
                    .setColor('#dd0000')
                    .setTitle('ERROR')
                    .setTimestamp()

                if(lastRestartOnError == -1) {
                    embed.addField('Info', `This is the first restart`)
                } else {
                    embed.addField('Info', `Last restart was ${timeDelta}ms ago`)
                }
                
                webhookClient.send({
                    username: 'ERROR',
                    avatarURL: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQXOesOOOSWhzSev4dDBTsfNJr0WVQgf6rwA&usqp=CAU',
                    embeds: [embed]
                })

                webhookClient.send({
                    username: 'ERROR',
                    avatarURL: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQXOesOOOSWhzSev4dDBTsfNJr0WVQgf6rwA&usqp=CAU',
                    content: '<@567316373647261716>'
                })

                spawnNewChild()
            } else {
                console.log(`\x1b[35mMAIN PROCESS\x1b[0m Cought an error. Restarting index.js: previous error restart was ${timeDelta}ms ago ( < 60000ms ). No more restarts`)

                const config = require('./src/config.json')
                const { MessageEmbed, WebhookClient } = require('discord.js')
                const webhookId = config.whid
                const webhookToken = config.whToken
                const webhookClient = new WebhookClient({ id: webhookId, token: webhookToken })

                const embed = new MessageEmbed()
                    .setColor('#dd0000')
                    .setTitle('ERROR')
                    .setTimestamp()

                if(lastRestartOnError == -1) {
                    embed.addField('Info', `This is the first restart`)
                } else {
                    embed.addField('Info', `Last restart was ${timeDelta}ms ago ( < 60000ms ). No more restarts`)
                }
                
                webhookClient.send({
                    username: 'ERROR',
                    avatarURL: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQXOesOOOSWhzSev4dDBTsfNJr0WVQgf6rwA&usqp=CAU',
                    embeds: [embed]
                })

                webhookClient.send({
                    username: 'ERROR',
                    avatarURL: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQXOesOOOSWhzSev4dDBTsfNJr0WVQgf6rwA&usqp=CAU',
                    content: '<@567316373647261716>'
                })
            }
        } else {
            console.log(code)
        }
    })
    
    child.stderr.on('data', data => {
        const config = require('./src/config.json')
        const { MessageEmbed, WebhookClient } = require('discord.js')
        const webhookId = config.whid
        const webhookToken = config.whToken
        const webhookClient = new WebhookClient({ id: webhookId, token: webhookToken })

        const embed = new MessageEmbed()
            .setColor('#dd0000')
            .setTitle('ERROR')
            .setDescription('' + data)
            .setTimestamp()
        
        webhookClient.send({
            username: 'ERROR',
            avatarURL: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQXOesOOOSWhzSev4dDBTsfNJr0WVQgf6rwA&usqp=CAU',
            embeds: [embed]
        })

        console.error(`stderr: ${data}`)
    })
}

spawnNewChild()
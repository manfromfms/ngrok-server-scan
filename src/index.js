var EventEmitter = require('events')
var CheckClass = require('./check.js')
var fs = require('fs')

var Search = require('./search.js')
var ModSaver = require('./modSaver.js')

var config = require('./config.json')

const ServersJsonPath = './src/servers.json'
const FullLogsJsonPath = './src/fullLogs.json'
const ModsJsonPath = './src/mods.json'

var ms = new ModSaver(ModsJsonPath)

var startDate = Date.now()

var checking = true

var restartFunc = () => {
    process.exit(123)
}

//get saved data
var output = fs.readFileSync(ServersJsonPath, 'utf8', (err) => {if(err) console.log(err)})
var opl = output.length
output = JSON.parse(output)

var flogs = fs.readFileSync(FullLogsJsonPath, 'utf8', (err) => {if(err) console.log(err)})
var fll = flogs.length
flogs = JSON.parse(flogs)

var mods = fs.readFileSync(ModsJsonPath, 'utf8', (err) => {if(err) console.log(err)})
var ml = mods.length
mods = JSON.parse(mods)

//setup discord webhook
const { MessageEmbed, WebhookClient, MessageAttachment, MessageActionRow, MessageButton} = require('discord.js')
const { SlashCommandBuilder } = require('@discordjs/builders')

const webhookId = config.whid
const webhookToken = config.whToken
const webhookClient = new WebhookClient({ id: webhookId, token: webhookToken })

const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')

const ping = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with pong')

const info = new SlashCommandBuilder()
    .setName('info')
    .setDescription("Returns bot's info")

const pause = new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pauses or continues server scanning (requires premission)')

const restart = new SlashCommandBuilder()
    .setName('restart')
    .setDescription('Restarts whole app (requires premission)')

const search = new SlashCommandBuilder()
    .setName('search')
    .setDescription('Searches for input in log file')
    .addStringOption(option =>
        option.setName('input')
            .setDescription('Data to search')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('from')
            .setDescription('Choose labels to search in (n - name, d - description, p - players names, o - online)')
            .setRequired(true))

const deepsearch = new SlashCommandBuilder()
.setName('deep-search')
.setDescription('Searches for input in full log file')
.addStringOption(option =>
    option.setName('input')
        .setDescription('Data to search')
        .setRequired(true))

const checkStatus = new SlashCommandBuilder()
.setName('check')
.setDescription('Check server status')
.addStringOption(option =>
    option.setName('server')
        .setDescription('Server to check')
        .setRequired(true))

const showall = new SlashCommandBuilder()
.setName('show-all')
.setDescription('Show all servers from query')
.addStringOption(option =>
    option.setName('id')
        .setDescription('Query id')
        .setRequired(true))

const commands = [ ping, pause, search, showall, checkStatus, info, restart, deepsearch ]

const rest = new REST({ version: '9' }).setToken(config.botToken);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
        Routes.applicationGuildCommands('975615147169161257', '791735125947449364'),
        { body: commands },
        )

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error)
    }
})() // update slash commands

const { Client, Intents } = require('discord.js')
const { execPath } = require('process')
const client = new Client({ intents: [Intents.FLAGS.GUILDS] })

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
    client.user.setActivity('for people on ngrok', { type: 'WATCHING' })
})

var queryStorage = {}
client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        var data = JSON.parse(interaction.customId)
        var channel = interaction.channel

        try {
            await interaction.reply('Your request is being processed')
        } catch(err) {}
        

        if(data.name == 'next') {
            if(!queryStorage[data.id]) {
                const embed = new MessageEmbed()
                    .setColor('#dd0000')
                    .setTitle('ERROR')
                    .setDescription('No query found')
                    .setTimestamp()
                channel.send({ embeds: [embed] })
                
                return
            }
            if(Object.keys(queryStorage[data.id]).length > 1) {
                var query = queryStorage[data.id]
                var option = query[Object.keys(query)[0]]
                if(!option.description.text) option.description.text = 'undefined'
                var lastcheck = Math.round((Date.now() - option.lastcheck) / 1000 / 60 * 10) / 10
                const embed = new MessageEmbed()
                    .setTitle(option.ip)
                    .setDescription(option.version.name)
                    .addFields(
                        { name: 'Online', value: option.players.online + '/' + option.players.max},
                        { name: 'Description', value: ' ' + option.description.text},
                        { name: 'Last check', value: `${lastcheck} minutes ago`},
                        { name: 'Version', value: `${option.version.name}`},
                        { name: 'Query', value: data.id + ' : ' + (Object.keys(query).length)}
                    )
                    .setTimestamp()

                if(option.alive) {
                    embed.setColor('#09ff41')
                } else {
                    embed.setColor('#ff4109')
                }

                if(option.players.sample) {
                    var names = ''
                    for(let i in option.players.sample) {
                        names += option.players.sample[i].name
                        names += '\n'
                    }
                    embed.addField('Players', names)
                }

                const row = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId(`{"id": ${data.id}, "name": "next"}`)
                            .setLabel('Next')
                            .setStyle('PRIMARY')
                    )

                channel.send({ embeds: [embed], components: [row]})
                
                queryStorage[data.id] = query
                delete queryStorage[data.id][Object.keys(query)[0]]

            } else if(Object.keys(queryStorage[data.id]).length == 1) {
                var query = queryStorage[data.id]
                var option = query[Object.keys(query)[0]]
                if(!option.description.text) option.description.text = 'undefined'
                var lastcheck = Math.round((Date.now() - option.lastcheck) / 1000 / 60 * 10) / 10
                const embed = new MessageEmbed()
                    .setTitle(option.ip)
                    .setDescription(option.version.name)
                    .addFields(
                        { name: 'Online', value: option.players.online + '/' + option.players.max},
                        { name: 'Description', value: ' ' + option.description.text},
                        { name: 'Last check', value: `${lastcheck} minutes ago`},
                        { name: 'Version', value: `${option.version.name}`},
                        { name: 'Query', value: data.id + ' : ' + 'the last one'}
                    )
                    .setTimestamp()

                if(option.alive) {
                    embed.setColor('#09ff41')
                } else {
                    embed.setColor('#ff4109')
                }

                if(option.players.sample) {
                    var names = ''
                    for(let i in option.players.sample) {
                        names += option.players.sample[i].name
                        names += '\n'
                    }
                    embed.addField('Players', names)
                }

                channel.send({ embeds: [embed] })
                delete queryStorage[data.id]
            } else {
                const embed = new MessageEmbed()
                    .setColor('#dd0000')
                    .setTitle('ERROR')
                    .setDescription('No query found')
                    .setTimestamp()
                channel.send({ embeds: [embed] })
                return
            }
        }
    } else {
        if (!interaction.isCommand()) return

        var channel = interaction.channel
        var member = interaction.member
        channel.sendTyping()
        try {
            interaction.reply('Your request is being processed')
        } catch(err) {}

        if (interaction.commandName === 'ping') {
            if(!checking) return
            channel.send('Pong!')
        } else if (interaction.commandName === 'pause' && member.roles.cache.some(role => role.name === 'ScanManager')) {
            checking = !checking
            console.log('Checking: ' + checking)
            const embed = new MessageEmbed()
                .setColor('#7823f0')
                .setTitle('Pause command')
                .setDescription('Checking has been set to ' + checking)
                .setTimestamp()

            webhookClient.send({
                username: 'Logs',
                avatarURL: 'https://play-lh.googleusercontent.com/VSwHQjcAttxsLE47RuS4PqpC4LT7lCoSjE7Hx5AW_yCxtDvcnsHHvm5CTuL5BPN-uRTP',
                embeds: [embed]
            })
            channel.send(`Checking has been set to ***${checking}***`)
        } else if(interaction.commandName === 'search') {
            if(!checking) return
            var query = {}
            var text = interaction.options.data[0].value
            //console.log(text)

            var searchSettings = 'ndpov'

            if(interaction.options.data[1].value) {
                searchSettings = interaction.options.data[1].value
            }

            if(searchSettings.toLowerCase().includes('n')) {
                for(let i in output) {
                    if(i.toLowerCase().includes(text)) {
                        var serverData = output[i]
                        serverData.ip = i
                        query[i] = serverData
                    }
                }
            }

            if(searchSettings.toLowerCase().includes('d')) {
                for(let i in output) {
                    try {
                        if(output[i].description.text.toLowerCase().includes(text)) {
                            var serverData = output[i]
                            serverData.ip = i
                            query[i] = serverData
                        }
                    }
                    catch(err) {}
                }
            }

            if(searchSettings.toLowerCase().includes('p')) {
                for(let i in output) {
                    if(!output[i].players.sample) continue

                    for(let j in output[i].players.sample) {
                        if(output[i].players.sample[j].name.toLowerCase().includes(text)) {
                            var serverData = output[i]
                            serverData.ip = i
                            query[i] = serverData
                        }
                    }
                }
            }

            if(searchSettings.toLowerCase().includes('o')) {
                for(let i in output) {
                    try {
                        if((output[i].players.online + '').toLowerCase().includes(text) || (output[i].players.max + '').toLowerCase().includes(text)) {
                            var serverData = output[i]
                            serverData.ip = i
                            query[i] = serverData
                        }
                    }
                catch(err) {}
                }
            }

            if(searchSettings.toLowerCase().includes('v')) {
                for(let i in output) {
                    try {
                        if(output[i].version.name.toLowerCase().includes(text)) {
                            var serverData = output[i]
                            serverData.ip = i
                            query[i] = serverData
                        }
                    }
                    catch(err) {}
                }
            }

            if(Object.keys(query).length == 0) {
                const embed = new MessageEmbed()
                    .setColor('#333333')
                    .setTitle('No reults found')
                    .setDescription('Nothing to show here')
                    .addField('Search request', text)
                    .setTimestamp()
                channel.send({ embeds: [embed] })
                return
            }

            var id = Date.now()

            const embed = new MessageEmbed()
                .setColor('#8f0af7')
                .setTitle('Formed new query')
                .setDescription('Length of server list is ' + Object.keys(query).length)
                .addFields(
                    {name: id + ' ', value: '/show-all ' + id}, 
                    {name: 'Search request', value: text}
                )
                .setTimestamp()

            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId(`{"id": ${id}, "name": "next"}`)
                        .setLabel('Watch')
                        .setStyle('PRIMARY')
                )

            channel.send({ embeds: [embed], components: [row]})

            queryStorage[id] = query
        } else if(interaction.commandName === 'deep-search') {
            if(!checking) return
            
            var text = interaction.options.data[0].value
            var search = new Search()
            var query = search.find(text, flogs)

            var id = Date.now()

            if(Object.keys(query).length == 0) {
                const embed = new MessageEmbed()
                    .setColor('#333333')
                    .setTitle('No reults found')
                    .setDescription('Nothing to show here')
                    .addField('Search request', text)
                    .setTimestamp()
                channel.send({ embeds: [embed] })
                return
            }

            const embed = new MessageEmbed()
                .setColor('#8f0af7')
                .setTitle('Formed new query')
                .setDescription('Length of server list is ' + Object.keys(query).length)
                .addFields(
                    {name: id + ' ', value: '/show-all ' + id}, 
                    {name: 'Search request', value: text}
                )
                .setTimestamp()

            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId(`{"id": ${id}, "name": "next"}`)
                        .setLabel('Watch')
                        .setStyle('PRIMARY')
                )

            channel.send({ embeds: [embed], components: [row]})

            queryStorage[id] = query

        } else if (interaction.commandName === 'show-all') {
            if(!checking) return
            var id = interaction.options.data[0].value

            if(!queryStorage[id]) {
                const embed = new MessageEmbed()
                    .setColor('#dd0000')
                    .setTitle('ERROR')
                    .setDescription('There is no query with same id')
                    .setTimestamp()
                channel.send({ embeds: [embed] })
                return
            }

            if(Object.keys(queryStorage[id]).length > 20) {
                const embed = new MessageEmbed()
                    .setColor('#dd0000')
                    .setTitle('ERROR')
                    .setDescription('Query has more than 20 servers')
                    .setTimestamp()
                
                channel.send({ embeds: [embed] })
                return
            }
            for(let i in queryStorage[id]) {
                var option = queryStorage[id][i]
                if(!option.description.text) option.description.text = 'undefined'
                var lastcheck = Math.round((Date.now() - option.lastcheck) / 1000 / 60 * 10) / 10
                const embed = new MessageEmbed()
                    .setTitle(option.ip)
                    .setDescription(option.version.name)
                    .addFields(
                        { name: 'Online', value: option.players.online + '/' + option.players.max},
                        { name: 'Description', value: ' ' + option.description.text},
                        { name: 'Last check', value: `${lastcheck} minutes ago`},
                        { name: 'Version', value: `${option.version.name}`}
                    )
                    .setTimestamp()

                if(option.alive) {
                    embed.setColor('#09ff41')
                } else {
                    embed.setColor('#ff4109')
                }

                if(option.players.sample && option.players.sample.length > 0) {
                    var names = ''
                    for(let i in option.players.sample) {
                        names += option.players.sample[i].name
                        names += '\n'
                    }
                    embed.addField('Players', names)
                }

                interaction.channel.send({ embeds: [embed] })
            }

            const embed = new MessageEmbed()
                .setColor('#0fa0ff')
                .setTitle('DONE')
                .setDescription('All query has been sent')
                .setTimestamp()
            channel.send({ embeds: [embed] })
        } else if (interaction.commandName === 'check') {
            if(!checking) return
            var ip = interaction.options.data[0].value
            check.get(ip, {name: ip + '', use: 'check', interaction: interaction})
        } else if (interaction.commandName === 'info') {
            var totalOnline = 0
            for(let i in output) {
                if(output[i].alive) totalOnline++
            }

            var now = Date.now()
            var uptime = (now - startDate)

            const embed = new MessageEmbed()
                .setColor('#07dfd1')
                .setTitle('INFO')
                .setDescription('Online')
                .addFields(
                    {name: 'Server list', value: `Items length: ${Object.keys(output).length}\nTotal chars length: ${JSON.stringify(output).length}`},
                    {name: 'Full logs list', value: `Items length: ${flogs.length}\nTotal chars length: ${JSON.stringify(flogs).length}`},
                    {name: 'Total online', value: `Online: ${totalOnline}`},
                    {name: 'Unshown queries', value: `Amount: ${Object.keys(queryStorage).length}`},
                    {name: 'Opened sockets', value: `Amount: ${socketsAmount}`}
                )
                .setTimestamp()

            if(uptime < 1000) {
                embed.addField('Uptime', uptime + 'ms')
            } else if(uptime >= 1000 && uptime < 60000) {
                embed.addField('Uptime', (uptime / 1000) + 's')
            } else if(uptime >= 60000 && uptime < 3600000) {
                embed.addField('Uptime', (uptime / 60000) + 'm')
            } else if(uptime >= 3600000 && uptime < 86400000) {
                embed.addField('Uptime', (uptime / 3600000) + 'h')
            } else if(uptime >= 86400000) {
                embed.addField('Uptime', (uptime / 86400000) + 'd')
            }
            
            channel.send({ embeds: [embed] })
            
        } else if (interaction.commandName === 'restart' && member.roles.cache.some(role => role.name === 'RestartManager')) {
            const embed = new MessageEmbed()
                .setColor('#2378f0')
                .setTitle('Restart command')
                .setTimestamp()

            webhookClient.send({
                username: 'Logs',
                avatarURL: 'https://play-lh.googleusercontent.com/VSwHQjcAttxsLE47RuS4PqpC4LT7lCoSjE7Hx5AW_yCxtDvcnsHHvm5CTuL5BPN-uRTP',
                embeds: [embed]
            })
            channel.send(`Restarting the app`)

            restartFunc()
            
        }
    }
})

client.login(config.botToken)


const embed = new MessageEmbed()
    .setColor('#ff0f95')
    .setTitle('START')
    .setDescription('new session has been started from ' + config.device)
    .addField('Logs sizes', `Full logs: ${fll} chars\nChecked servers: ${opl} chars\nMods: ${ml} chars, ${mods.length} items`)
    .setTimestamp()

webhookClient.send({
    username: 'Logs',
    avatarURL: 'https://play-lh.googleusercontent.com/VSwHQjcAttxsLE47RuS4PqpC4LT7lCoSjE7Hx5AW_yCxtDvcnsHHvm5CTuL5BPN-uRTP',
    embeds: [embed]
})

//get the check library
var check = new CheckClass(EventEmitter)

check.eventEmitter.on('serverStatus', async (data) => {
    socketsAmount--
    if(data.status == 'error') {
        if(output[data.addition.name]) {
            output[data.addition.name].alive = false
            output[data.addition.name].lastcheck = Date.now()
        }
    } else {
        if(data.addition.use == 'check') {
            var interaction = data.addition.interaction
            delete data.addition.interaction
            data.date = Date.now()

            data.addition.name = data.addition.name.toLowerCase()
            
            console.log(data.addition)

            if(data.addition.name.includes('.ngrok.io')) {
                output[data.addition.name] = data.raw
                output[data.addition.name].ip = data.addition.name
                output[data.addition.name].alive = true
                output[data.addition.name].lastcheck = Date.now()

                if(output[data.addition.name].forgeData) output[data.addition.name].forgeData = true

                delete output[data.addition.name].favicon

                if(output[data.addition.name].modinfo) delete output[data.addition.name].modinfo.modList

                flogs.push(output[data.addition.name])

                fs.writeFileSync(ServersJsonPath, JSON.stringify(output), (err) => {if(err) console.log(err)})
                //fs.writeFileSync(FullLogsJsonPath, JSON.stringify(flogs), (err) => {if(err) console.log(err)})
            }

            const embed = new MessageEmbed()
                .setColor('#0ff0a1')
                .setTitle(data.addition.name)
                .setDescription(data.version.name)
                .addFields(
                    { name: 'Online', value: data.players.online + '/' + data.players.max},
                    { name: 'Description', value: 'Text: ' + data.description}
                )
                .setTimestamp()

            embed.addField('From', '🔍Checked by user🔍')


            interaction.reply({ embeds: [embed] })
        } else if(data.addition.use == 'linear') {
            try {
            data.date = Date.now()
            
            console.log(data.addition)

            var description = data.raw.description

            var desc = ''
            if(description.extra) {
                for(let i in description.extra) {
                    if(description.extra[i].color) {
                        desc += `$/${description.extra[i].color.replace(/_+/g, '')} `
                    } else {
                        desc += `$/white `
                    }

                    desc += description.extra[i].text
                }
            } else {
                desc = description.text
                outdesc = ''
                if(desc.length > 0 && (desc.includes('&') || desc.includes('§'))) {
                    for(let i = 0; i < desc.length; i++) {
                        if(desc[i] == '&' && i + 1 != desc.length) {
                            var colorLetter = desc[i+1]

                            switch(colorLetter) {
                                case '0':
                                    outdesc += '$/black '
                                break;
                                case '1':
                                    outdesc += '$/darkblue '
                                break;
                                case '2':
                                    outdesc += '$/darkgreen '
                                break;
                                case '3':
                                    outdesc += '$/#249d9f '
                                break;
                                case '4':
                                    outdesc += '$/darkred '
                                break;
                                case '5':
                                    outdesc += '$/#570861 '
                                break;
                                case '6':
                                    outdesc += '$/gold '
                                break;
                                case '7':
                                    outdesc += '$/gray '
                                break;
                                case '8':
                                    outdesc += '$/darkgray '
                                break;
                                case '9':
                                    outdesc += '$/blue '
                                break;
                                case 'a':
                                    outdesc += '$/green '
                                break;
                                case 'b':
                                    outdesc += '$/aqua '
                                break;
                                case 'c':
                                    outdesc += '$/red '
                                break;
                                case 'd':
                                    outdesc += '$/#b19cd9 '
                                break;
                                case 'e':
                                    outdesc += '$/yellow '
                                break;
                                case 'f':
                                    outdesc += '$/white '
                                break;
                            }
                            i++
                        } else {
                            outdesc += desc[i]
                        }
                    }

                    desc = outdesc
                }
            }

            output[data.addition.name] = data.raw
            output[data.addition.name].ip = data.addition.name
            output[data.addition.name].alive = true
            output[data.addition.name].lastcheck = Date.now()

            if(output[data.addition.name].forgeData) output[data.addition.name].forgeData = true

            delete output[data.addition.name].favicon

            flogs.push(output[data.addition.name])
            //console.log(output[data.addition.name])

            //console.log(mods)
            //fs.writeFileSync(ModsJsonPath, JSON.stringify(mods), (err) => {if(err) console.log(err)})
            fs.writeFileSync(ServersJsonPath, JSON.stringify(output), (err) => {if(err) console.log(err)})
            //fs.writeFileSync(FullLogsJsonPath, JSON.stringify(flogs), (err) => {if(err) console.log(err)})

            const embed = new MessageEmbed()
                .setColor('#0ff0a1')
                .setTitle(data.addition.name)
                .setDescription(data.version.name)
                .addFields(
                    { name: 'Online', value: data.players.online + '/' + data.players.max}
                )
                .setTimestamp()

            /*if(output[data.addition.name].modinfo) {
                var modlist = ms.newServerModinfo(output[data.addition.name].modinfo)
                embed.addField("Modinfo", modlist)
            }*/

            if(data.players.online > 0 && data.players.sample) {
                var names = ''
                for(let i in data.players.sample) {
                    names += data.players.sample[i].name
                    names += '\n'
                }
                if(names.length > 0) embed.addField('Players', names)
            }

            if(desc) {
                if(desc.length > 0) {
                    embed.addField('Description', desc)
                }
            }

            if(output[data.addition.name].modinfo || output[data.addition.name].forgeData) {
                embed.addField('Modded', 'true')
                output[data.addition.name].modded = true
            } else {
                embed.addField('Modded', 'false')
                output[data.addition.name].modded = false
            }

            embed.addField('From', '💾main loop💾')

            if(data.favicon) {
                try {
                    var base64_img = data.favicon
                
                    const sfbuff = new Buffer.from(base64_img.split(",")[1], "base64")
                    const sfattach = new MessageAttachment(sfbuff, "fav.png")

                    embed.setImage('attachment://fav.png')

                    webhookClient.send({
                        username: 'Logs',
                        avatarURL: 'https://play-lh.googleusercontent.com/VSwHQjcAttxsLE47RuS4PqpC4LT7lCoSjE7Hx5AW_yCxtDvcnsHHvm5CTuL5BPN-uRTP',
                        embeds: [embed],
                        files: [sfattach]
                    })

                    return
                } catch(err) {}
            }

            webhookClient.send({
                username: 'Logs',
                avatarURL: 'https://play-lh.googleusercontent.com/VSwHQjcAttxsLE47RuS4PqpC4LT7lCoSjE7Hx5AW_yCxtDvcnsHHvm5CTuL5BPN-uRTP',
                embeds: [embed]
            })
            
            } catch (err) {}
        } else if(data.addition.use == 'renew') {
            console.log(data.addition)

            output[data.addition.name] = data.raw
            output[data.addition.name].alive = true
            output[data.addition.name].lastcheck = Date.now()
            delete output[data.addition.name].favicon
            delete output[data.addition.name].forgeData
            delete output[data.addition.name].modinfo

            flogs.push(output[data.addition.name])

            fs.writeFileSync('./servers.json', JSON.stringify(output), (err) => {if(err) console.log(err)})
            //fs.writeFileSync('./fullLogs.json', JSON.stringify(flogs), (err) => {if(err) console.log(err)})
        }
    }
})

/*
var index = 0
setInterval(async () => {
    if(!checking) return
    if(index >= Object.keys(output).length) index
    var name = Object.keys(output)[index]
    check.get(name + '', {name: name + '', use: 'renew'})
    index++
}, 100)
*/

var ind = 10000 * 20
var socketsAmount = 0
setInterval(async () => {
    if(!checking) return
    var num = ind % 20 + 1
    var port = Math.floor(ind / 20)
    if(num <= 10) {
        check.get(`${num}.tcp.eu.ngrok.io:${port}`, {name: `${num}.tcp.eu.ngrok.io:${port}`, use: 'linear'})
    } else {
        check.get(`${num-10}.tcp.ngrok.io:${port}`, {name: `${num-10}.tcp.ngrok.io:${port}`, use: 'linear'})
    }
    ind++
    socketsAmount++
    if(ind >= 20000 * 20) ind = 10000 * 20
}, 22)

/*
var ind = 10000 * 20
var socketsAmount = 0
setInterval(async () => {
    if(!checking) return
    var num = ind % 20 + 1
    var port = Math.floor(ind / 20)
    if(num <= 10) {
        check.get(`${num}.tcp.eu.ngrok.io:${port}`, {name: `${num}.tcp.eu.ngrok.io:${port}`, use: 'linear'})
    } else {
        check.get(`${num-10}.tcp.ngrok.io:${port}`, {name: `${num-10}.tcp.ngrok.io:${port}`, use: 'linear'})
    }
    ind++
    socketsAmount++
    if(ind >= 20000 * 20) ind = 10000 * 20
}, 22)
*/

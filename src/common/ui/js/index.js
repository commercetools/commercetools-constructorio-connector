let projects = {}
let endpoints = []
let user = null

_.nmap = (coll, iter) => _.filter(_.map(coll, iter), x => x);
_.ff = (coll, filter) => _.first(_.filter(coll, filter));

let localPath = window.location.pathname.replace('/ui/', '')

let template = {
    client_id: '',
    client_secret: '',
    oauth_url: '',
    api_url: '',
    scopes: []
}

function onSignIn(googleUser) {
    user = googleUser.getBasicProfile();
    document.getElementById('name').innerHTML = user.getName()
    refreshProjects()
    loadSharedServices()
}

function signOut() {
    var auth2 = gapi.auth2.getAuthInstance();
    user = null;
    auth2.signOut().then(function () {
        refreshProjects()
        loadSharedServices()
        $('#name').html('')
        console.log('User signed out.');
    });
}

let siteRow = site => `
    <li class='list-group-item'>
        <div class='row'>
            <div class='col-md-12'><a href='/${site.name}' target=_blank>${site.name}</a></div>
        </div>
    </li>
`

let microserviceServiceList = (service, endpoints) => `
    <ul>
        <li class='list-group-item region'>${service}</li>
        ${_.map(endpoints, microserviceRow).join('')}
    </ul>
`

let microserviceRow = microservice => `
    <li class='list-group-item'>
        <div class='row'>
            <div class='col-md-2'><div class='badge badge-${microservice.method}'>${microservice.method}</div></div>
            <div class='col-md-6 microservice-path'>${microservice.path}</div>
            <div class='col-md-4'></div>
        </div>
    </li>
`

let loadSharedServices = async () => {
    let html = ''
    if (user) {
        try {
            endpoints = await $.ajax(`${localPath}/api`)

            let microservicesByService = _.groupBy(_.filter(endpoints, e => e.type === 'microservices'), 'service')
            html = _.map(Object.keys(microservicesByService), service => {
                let serviceEndpoints = microservicesByService[service]
                return microserviceServiceList(service, serviceEndpoints)
            }).join('')

            let sites = _.filter(endpoints, e => e.type === 'web')

            if (sites.length > 0) {
                html += `
                    <ul>
                        <li class='list-group-item region'>Sites</li>
                        ${_.map(sites, siteRow).join('')}
                    </ul>
                `
            }
        } catch (error) {
            console.error(error)
        }
    }
    $('#sharedServicesList').html(html)
}

let refreshProjects = async () => {
    let html = ''
    if (user) {
        try {
            projects = await $.ajax(`${localPath}/api/projects`)
        
            let groupedProjects = _.groupBy(projects, 'region')
            _.each(Object.keys(groupedProjects), group => {
                let regionProjects = groupedProjects[group]
                html += `<ul>`
                html += `<li class='list-group-item region'>${group}</li>`
                _.each(_.sortBy(regionProjects, 'projectKey'), project => {
                    html += `<li class='project list-group-item' onclick='clickRow("${project.projectKey}")'>${project.projectKey}</li>`
                })
                html += `</ul>`
            })
        } catch (error) {
            console.error(error)
        }
    }
    $('#projectsList').html(html)
}

let clickRow = async projectKey => {
    let project = await $.ajax({
        url: `${localPath}/api/project`,
        headers: { 'Authorization': projectKey }
    })

    let byService = {}
    _.each(endpoints, endpoint => {
        let services = _.flatten(_.concat([], Object.values(project)))

        console.log(JSON.stringify(services))

        if (_.includes(Object.keys(project), 'subscriptions')) {
            let service = _.ff(services, s => s.key === endpoint.key)

            endpoint.active = _.includes(_.map(services, 'key'), endpoint.key)
            endpoint.activeHTML = `
                <input class="toggle" type="checkbox" ${endpoint.active ? 'checked' : ''} id='toggle-${endpoint.key}'/>
                <div class='toggle-switch inactive' data-project-key='${projectKey}' data-key='${endpoint.key}' data-type='${endpoint.type}' data-active='${endpoint.active}'>
                    <span class="spinner-border text-light hidden" role="status" aria-hidden="true"></span>
                </div>
            `

            endpoint.url = ''
            if (endpoint.type === 'extensions') {
                endpoint.url = service && service.destination && service.destination.url
            }
            if (endpoint.type === 'subscriptions') {
                endpoint.url = service && service.destination && service.destination.topic
            }
        }
        else {
            endpoint.active = false
            endpoint.activeHTML = ''
        }

        if (endpoint.service) {
            byService[endpoint.service] = byService[endpoint.service] || []
            byService[endpoint.service].push(endpoint)
        }
    })

    let html = ''
    _.each(Object.keys(byService), service => {
        let endpoints = byService[service]

        let serviceAllActive = _.every(endpoints, 'active')
    
        let serviceActiveHTML = `
            <input class="toggle" type="checkbox" ${serviceAllActive ? 'checked' : ''} id='toggle-${service}'/>
            <div class='toggle-switch inactive' data-service='${service}' data-active='${serviceAllActive}'>
                <span class="spinner-border text-light hidden" role="status" aria-hidden="true"></span>
            </div>
        `

        let services = _.filter(endpoints, endpoint => endpoint.type === 'extensions' || endpoint.type === 'subscriptions')

        if (services.length > 0) {
            html += `<ul>`
            html += `
                <li class='list-group-item service'>
                    <div class='row'>
                        <div class='col col-md-9'>${service}</div>
                        <div class='col col-md-2'></div>
                        <div class='col col-md-1'></div>
                    </div>
                </li>
            `
            _.each(services, endpoint => {
                endpoint.url = endpoint.url || ''
                html += `
                    <li class='list-group-item ${endpoint.type}'>
                        <div class='row'>
                            <div class='col col-md-5'>${endpoint.key}</div>
                            <div class='col col-md-4'>${endpoint.type}</div>
                            <div class='col col-md-2'>${endpoint.activeHTML}</div>
                            <div class='col col-md-1'><span class='icon icon-info'></span></div>
                        </div>
                        <div class='row'>
                            <div class='col col-md-12 endpoint-url'>${endpoint.url}</div>
                        </div>
                    </li>
                `
            })
            html += `</ul>`
        }
    })

    $('#projectDetailServices').html(html)
    $('#projectTitle').text(projectKey)
    $('#projectDetail').fadeIn(200)
}

let showProjectCreate = () => {
    $('#saveProjectButton').prop('disabled', true)

    $('#projectCreate .form-control').val('')
    $('#projectCreate .form-control').removeClass('error success')

    $('#projectCreate').fadeIn(200, async () => {
        let clipped = await navigator.clipboard.readText()
        if (clipped.indexOf('commercetools.com') > -1) {
            $('#pastedCredentials').val(clipped)
            parseCredentialPaste()
        }
        else {
            $('#pastedCredentials').focus()
        }
    })
}

let parseCredentialPaste = () => {
    let pasted = $('#pastedCredentials').val()
    let credential = {}

    _.each(Object.keys(template), key => {
        $(`#field_${key}`).removeClass('error success')
    })

    if (_.isEmpty(pasted)) {
        return
    }

    _.each(pasted.split('\n'), line => {
        line = line.replace(' = ', '=')
        line = line.replace(/"/g, '')
        line = line.replace(/^ +/, '')

        // environment variables
        line = line.replace('export CTP_', '')

        let splitchar = line.indexOf(': ') > -1 ? ': ' : '='
        let [key, value] = line.split(splitchar)

        // java properties
        key = key.replace('ctp.', '')

        // sunrise spa
        key = key.replace('VUE_APP_CT_', '')
        key = key.replace('HOST', 'URL')
        key = key.toLowerCase()

        console.log(`key ${key}`)

        let templateKey = findTemplateKey(key)
        if (templateKey) {
            credential[templateKey] = value
        }
    })

    $('#field_client_id').val(credential.client_id)
    $('#field_client_secret').val(credential.client_secret)
    $('#field_oauth_url').val(credential.oauth_url)
    $('#field_api_url').val(credential.api_url)
    $('#field_scopes').val(credential.scopes)

    _.each(Object.keys(template), key => {
        if (_.isEmpty(credential[key])) {
            $(`#field_${key}`).addClass('error')
        }
        else {
            $(`#field_${key}`).addClass('success')
        }
    })

    let mismatches = matchesTemplate(credential)
    if (mismatches.length === 0) {
        $('#saveCredentialButton').prop('disabled', false)
    }
    else {
        $('#saveCredentialButton').prop('disabled', true)
        console.log(`mismatches: ${JSON.stringify(mismatches)}`)
    }
}

let saveCredential = async () => {
    let project = {
        project: getProjectKeyFromScopes(),
        client_id: $('#field_client_id').val(),
        client_secret: $('#field_client_secret').val(),
        oauth_url: $('#field_oauth_url').val(),
        api_url: $('#field_api_url').val(),
        scopes: $('#field_scopes').val().split(' ')
    }

    if (!projects[project.project] || (projects[project.project] && confirm(`Project ${project.project} already has credentials in the vault; overwrite?`))) {
        $('#saveSpinner').show()
        let response = await $.ajax({
            method: 'post',
            url: `${localPath}/api/projects`,
            dataType: 'json',
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(project)
        })
        $('#saveSpinner').hide()

        refreshProjects()
        $('#projectCreate').fadeOut(200)
    }
}

let matchesTemplate = credential => {
    let mismatches = []
    _.each(Object.keys(template), tk => {
        if (!credential[tk]) {
            mismatches.push(tk)
        }
    })
    return mismatches
}

let getProjectKeyFromScopes = () => {
    let scopes = $('#field_scopes').val().split(' ')
    let scope = _.first(scopes)
    let [permission, project] = scope.split(':')
    return project
}

let findTemplateKey = key => {
    let keys = []
    _.each(Object.keys(template), tk => {
        keys.push({ key: tk, distance: levenshtein(key, tk) })
    })
    keys = _.sortBy(keys, 'distance')
    let closest = _.first(keys)
    if (closest.distance <= 3) {
        return closest.key
    }
    else {
        return null
    }
}

$(document).on('click', '.btn-close', function () {
    let e = $(this).closest('.modal')
    e.fadeOut(200)
})

$(document).on('keyup paste', '#pastedCredentials', () => {
    setTimeout(parseCredentialPaste, 100)
})

$(document).ready(async () => {
    $('#saveSpinner').hide()
})

$(document).on('click', '.toggle-switch', async function () {
    $(this).blur()
    $(this).removeClass('inactive')
    $(this).find('.spinner-border').removeClass('hidden')

    let serviceKey = $(this).data('key')
    let serviceType = $(this).data('type')
    let serviceActive = $(this).data('active')
    let projectKey = $(this).data('project-key')

    let url = `${localPath}/api/${serviceType}${serviceActive ? '?key=' + serviceKey : ''}`
    let method = serviceActive ? 'delete' : 'post'

    let request = {
        url,
        method,
        dataType: 'json',
        contentType: "application/json; charset=utf-8",
        headers: { 'Authorization': projectKey }
    }

    request.data = serviceActive ? null : JSON.stringify({
        project: projectKey,
        key: serviceKey,
        protocol: window.location.protocol.replace(':', ''),
        host: window.location.host,
        localPath
    })

    try {        
        let response = await $.ajax(request)
        $(this).closest('.list-group-item').find('.endpoint-url').text(!serviceActive ? (response.destination.url || response.destination.topic) : '')

        $(`#toggle-${serviceKey}`).prop('checked', !serviceActive)
        $(this).data('active', !serviceActive)
        $(this).addClass('inactive')
        $(this).find('.spinner-border').addClass('hidden')
    } catch (error) {
        
    }
})
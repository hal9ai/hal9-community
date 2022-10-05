
const ServerImplementation = function(hostopt) {
  let backendquery = '';
  let serverurls = hostopt.designer;

  async function initHeartbeat() {
    if (!serverurls.heartbeat) return;

    const heartbeatms = serverurls.heartbeatms ?? 60 * 1000;
    const sendhb = async function() {
      try {
        const resp = await fetch(serverurls.heartbeat + backendquery);
        if (!resp.ok) {
          console.error('Failed to register heartbeat: ' + (await resp.text()));
        }
      }
      catch(e) {
        console.error('Failed to receive response for heartbeat: ' + e.toString());
      }
    }
    sendhb();
    setInterval(sendhb, heartbeatms);
  }

  async function initBackend() {
    if (!serverurls.init) return;

    let backendid = crypto.getRandomValues(new Uint32Array(2)).join('-');
    backendquery = '?' + new URLSearchParams({
      backendid: backendid
    });

    try {
      let retries = 10;
      let resp;

      while (retries-- > 0) {
        resp = await fetch(serverurls.init + backendquery);

        if (resp.status == 1000) {
          await new Promise((a) => setTimeout(a, 250))
        }

        if (resp.ok) break;
      }

      if (!resp.ok) {
        console.error('Failed to initialize backend: ' + (await resp.text()));
      }

      initHeartbeat();
    }
    catch(e) {
      console.error('Failed to receive response for backend initialization: ' + e.toString());
    }
  }

  async function processOne(body) {
    let resp;
    try {
      resp = await fetch(serverurls.eval + backendquery, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    }
    catch (e) {
      throw('Server /' + serverurls.eval + ' failed: [' + e.toString() + ']')
    }

    return resp;
  }

  this.process = async function(body) {
    console.log('Sending: \n' + JSON.stringify(body, null, 2));

    let retries = 8;
    let resp;

    while (retries-- > 0) {
      resp = await processOne(body)

      if (resp.status == 500) {
        await new Promise((a) => setTimeout(a, 250))
      }

      if (resp.ok) break;
    }

    if (!resp.ok) {
      throw('Server /' + serverurls.eval + ' failed with ' + resp.statusText + ': [' + (await resp.text()) + ']')
    }

    const updates = await resp.json();

    console.log('Receiving: \n' + JSON.stringify(updates, null, 2));

    return updates;
  }

  this.addRuntime = async function(spec) {
    if (hostopt.serverurls) serverurls = await hostopt.serverurls();
    await initBackend();
    return spec;
  }

  this.putFile = async function(runtime, path, contents) {
    const resp = await fetch(serverurls.putfile + backendquery, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        path: path,
        contents: contents
      })
    });
    if (!resp.ok) {
      console.error('Failed to update file: ' + (await resp.text()));
      return;
    }

    return await resp.json();
  }
}

export const create = function(hostopt) {
  return new ServerImplementation(hostopt);
}
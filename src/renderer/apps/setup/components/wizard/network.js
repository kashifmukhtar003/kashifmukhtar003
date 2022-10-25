import React, { useEffect, useState } from 'react'
import Select from '../atomic/select';
import Accordion from '../atomic/accordion';
import Input from '../atomic/input';
import { useForm, Controller } from "react-hook-form";
import { Link } from 'react-router-dom';

import InfoBox from './info-box';

const Network = () => {

  const [networkConfig, setNetworkConfig] = useState({})

  // const [networkConfig, setNetworkConfig] = useState(null);
  const [networkInterfaces, setNetworkInterfaces] = useState();

  useEffect(() => {
    async function setup() {
      // Fetch network interfaces from main process
      const {netInterfaces} = await window.api.send('osConfig', { action: 'networkInterfaces' })
      setNetworkInterfaces(netInterfaces)

      // Fetch saved network config
      const networkConfigs = await window.api.send('osConfig', { action: 'networkConfigs' })
      if (networkConfigs?.length) {
        const temp = { ethernets: {} }
        networkConfigs.forEach(n => {
          temp.ethernets[n.name] = n
        })
        setNetworkConfig(temp);
      } else {
        setNetworkConfig(generateNewConfig(netInterfaces))
      }
    }
    setup()
  }, [])

  const createNewNetwork = () => {
    const temp = networkConfig;
    if (!temp.ethernets) {
      temp.ethernets = {};
    }
    temp.ethernets['empty'] = { dhcp: false }
    setNetworkConfig({...temp})
  }

  const saveConfig = async (name, data) => {
    const temp = networkConfig;
    if (!temp.ethernets) {
      temp.ethernets = {};
    }
    if (data.name !== name) {
      delete temp.ethernets[name]
    }
    temp.ethernets[data.name] = data
    const res = await window.api.send('osConfig', { action: 'saveNetworkConfig', data })
    setNetworkConfig({...temp})
  }

  const generateNewConfig = (interfaces) => {
    const obj = { ethernets: {} };

    Object.keys(interfaces).forEach((name) => {
      const net = interfaces[name];
      const conf = net.length === 1 ? net[0] : net.find((n) => n.family === "IPv4");

      obj.ethernets[name] = {
        name,
        dhcp4: conf.family === "IPv4",
        dhcp4Overrides: {
          routeMetric: null,
        },
        dhcp6: conf.family === "IPv6",
        dhcp6Overrides: {
          routeMetric: null,
        },
        addresses: null,
        gateway: null,
        nameserverAddresses: null,
      };
    })

    return obj;
  };

  const handleDeleteEthernet = name => {
    const temp = networkConfig;
    delete temp.ethernets[name]
    setNetworkConfig({...temp})
  }

  return (
    <div className='flex flex-col justify-between items-center h-full'>
    <div className='flex w-full'>
      <InfoBox color='bg-green-400'>
        <ul>
          <li>Both network cards are set up with DHCP as default setting</li>
          <li>Set up your network with static IP,Gateway and DNS servers by editing settings for the relevant network card</li>
          <li>...</li>
        </ul>
      </InfoBox>

      <div className='w-6/12 flex flex-col items-center space-y-6'>
        {Object.keys(networkConfig?.ethernets || {}).map(name => {
          const config = networkConfig.ethernets[name]
          return (
            <Accordion
              key={name}
              data={[
                {
                  title: name,
                  content: (
                    <NetworkForm
                      networkInterfaces={networkInterfaces}
                      initialConfig={config}
                      onSubmit={(data) => saveConfig(name, data)}
                      handleDelete={() => handleDeleteEthernet(name)}
                    />
                  ),
                },
              ]}
            />
          );
        })}

        <button 
          onClick={() => !networkConfig?.ethernets?.empty && createNewNetwork()} 
          className={`${networkConfig?.ethernets?.empty ? 'bg-blue-400' : 'bg-blue-500 hover:bg-blue-700'} text-white font-bold py-2 px-4 rounded w-max`}
        >
          New Network +
        </button>
      </div>
    </div>
    <Link to='/register'>Next</Link>
    </div>
  )
}

const NetworkForm = ({ networkInterfaces, onSubmit, initialConfig={}, handleDelete }) => {
  const dhcpOptions = [
    { key: "unspecified", text: "unspecified", value: null },
    { key: "yes", text: "yes/true", value: true },
    { key: "no", text: "no/false", value: false },
  ]

  const [networkInterfaceOptions, setNetworkInterfaceOptions] = useState([]);
  const [dhcp4, setDhcp4] = useState({ key: "unspecified", text: "unspecified", value: null });
  const [dhcp6, setDhcp6] = useState({ key: "unspecified", text: "unspecified", value: null });

  useEffect(() => {
    // Get network interfaces from electron
    setNetworkInterfaceOptions(!networkInterfaces ? [] : Object.keys(networkInterfaces).map(netInterface => ({ text: netInterface, value: netInterface, key: netInterface })))

  }, [networkInterfaces])

  const { control, handleSubmit, getValues } = useForm();

  const formatData = data => {
    data.name = data.name.value;
    data.dhcp4 = data.dhcp4.value;
    data.dhcp6 = data.dhcp6.value;
    if (data.dhcp4) data.dhcp4Overrides.routeMetric = parseInt(data.dhcp4Overrides.routeMetric) || null
    if (data.dhcp6) data.dhcp6Overrides.routeMetric = parseInt(data.dhcp6Overrides.routeMetric) || null

    return data;
  }

  return (
    <form
      onSubmit={handleSubmit(data => {
        const formattedData = formatData(data);
        onSubmit(formattedData)
      })}
      className="flex flex-col items-center space-y-4"
    >
      <div className="w-full">
        <label htmlFor="name">Interface Name</label>
        <Controller
          name="name"
          control={control}
          render={({ field }) =>
            networkInterfaceOptions?.length ? (
              <Select
                className="w-full"
                data={networkInterfaceOptions}
                defaultValue={{ text: initialConfig.name, value: initialConfig.name, key: initialConfig.name }}
                {...field}
              />
            ) : null
          }
        />
      </div>

      <div className="w-full">
        <label htmlFor="dhcp4">DHCP4</label>
        <Controller
          name="dhcp4"
          control={control}
          render={({ field }) => {
            const { onChange } = field;
            return (
              <Select
                className="w-full"
                data={dhcpOptions}
                defaultValue={dhcpOptions[initialConfig.dhcp4 ? 1 : 2]}
                {...field}
                onChange={(val) => {
                  onChange(val);
                  setDhcp4(getValues("dhcp4"));
                }}
              />
            );
          }}
        />
      </div>

      {dhcp4?.key === "yes" ? (
        <div className="w-full pl-3">
          <label htmlFor="dhcp4Overrides.routeMetric">Override: route metric</label>
          <Controller
            name="dhcp4Overrides.routeMetric"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="eg. 500"
                defaultValue={initialConfig?.dhcp4Overrides?.routeMetric}
                type="number"
              />
            )}
          />
        </div>
      ) : null}

      <div className="w-full">
        <label htmlFor="dhcp6">DHCP6</label>
        <Controller
          name="dhcp6"
          control={control}
          render={({ field }) => {
            const { onChange } = field;
            return (
              <Select
                className="w-full"
                data={dhcpOptions}
                defaultValue={dhcpOptions[initialConfig.dhcp6 ? 1 : 2]}
                {...field}
                onChange={(val) => {
                  onChange(val);
                  setDhcp6(getValues("dhcp6"));
                }}
              />
            );
          }}
        />
      </div>

      {dhcp6?.key === "yes" ? (
        <div className="w-full pl-3">
          <label htmlFor="dhcp6Overrides.routeMetric">Override: route metric</label>
          <Controller
            name="dhcp6Overrides.routeMetric"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="eg. 500"
                defaultValue={initialConfig?.dhcp6Overrides?.routeMetric}
                type="number"
              />
            )}
          />
        </div>
      ) : null}

      <div className="w-full">
        <label htmlFor="addresses">Addresses</label>
        <Controller
          name="addresses"
          control={control}
          render={({ field }) => (
            <Input {...field} id="addresses" placeholder="127.0.0.1" defaultValue={initialConfig?.addresses} />
          )}
        />
      </div>

      <div className="w-full">
        <label htmlFor="gateway">Gateway</label>
        <Controller
          name="gateway"
          control={control}
          render={({ field }) => (
            <Input {...field} id="gateway" placeholder="127.0.0.1" defaultValue={initialConfig?.gateway} />
          )}
        />
      </div>

      <div className="w-full">
        <label htmlFor="nameserverAddresses">Nameserver addresses</label>
        <Controller
          name="nameserverAddresses"
          control={control}
          render={({ field }) => (
            <Input {...field} id="nameserverAddresses" placeholder="127.0.0.1,192.168.1.2" defaultValue={initialConfig?.nameserverAddresses} />
          )}
        />
        <small>List of addresses - comma separated</small>
      </div>

      <div className='flex space-x-4'>
        <button
          onClick={e => {
            e.preventDefault();
            handleDelete && handleDelete();
          }}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-min mt-3"
        >
          Delete
        </button>

        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-min mt-3"
        >
          Save
        </button>
      </div>
    </form>
  );

}

export default Network

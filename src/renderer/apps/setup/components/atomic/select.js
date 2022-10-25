import React, { Fragment, useState, forwardRef, useEffect } from 'react'
import { Listbox, Transition } from '@headlessui/react'
// import { CheckIcon, SelectorIcon } from '@heroicons/react/solid'

const Select = forwardRef(({ data, defaultValue, defaultValueIndex, className, onChange, onBlur }, ref) => {
  const [selected, setSelected] = useState(null)

  const handleOnChange = value => {
    setSelected(value);
    onChange && onChange(value)
  }

  useEffect(() => {
    handleOnChange(defaultValue ? defaultValue : data[defaultValueIndex || 0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={className} ref={ref}>
      <Listbox value={selected} onChange={handleOnChange} onBlur={onBlur}>
        <div className="relative mt-1">
          <Listbox.Button className="relative w-full py-2 pl-3 pr-10 text-left bg-white rounded shadow-md cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-opacity-75 focus-visible:ring-white focus-visible:ring-offset-orange-300 focus-visible:ring-offset-2 focus-visible:border-indigo-500 sm:text-sm">
            <span className="block truncate">{selected?.text || ''}</span>
            {/* <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <SelectorIcon
                className="w-5 h-5 text-gray-400"
                aria-hidden="true"
              />
            </span> */}
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 w-full py-1 mt-1 overflow-auto text-base bg-white rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {data.map((element, index) => (
                <Listbox.Option
                  key={element?.key || index}
                  className={({ active }) => `${active ? 'bg-blue-100' : 'text-gray-900'} cursor-default select-none relative py-2 pl-10 pr-4`}
                  value={element}
                >
                  {({ selected, active }) => {

                    
                    return (
                    <>
                      <span
                        className={`${
                          selected ? 'font-bold' : 'font-normal'
                        } block truncate`}
                      >
                        {element.text}
                      </span>
                    </>
                  )}}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
})

export default Select;
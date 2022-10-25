import React from 'react';
import { Disclosure } from "@headlessui/react";
// import { ChevronUpIcon } from "@heroicons/react/solid";

export default function Accordion({ data }) {
  return (
    <div className="w-full px-4">
      {data.map((element, index) => {
        return (
          <div key={index} className="w-full max-w-md p-2 mx-auto bg-white rounded-2xl">
            <Disclosure>
              {({ open }) => (
                <>
                  <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-purple-900 bg-purple-100 rounded-lg hover:bg-purple-200 focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75">
                    <span>{element.title}</span>
                    {/* <ChevronUpIcon
                  className={`${
                    open ? 'transform rotate-180' : ''
                  } w-5 h-5 text-purple-500`}
                /> */}
                  </Disclosure.Button>
                  <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-500">
                    {element.content}
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          </div>
        );
      })}
    </div>
  );
}

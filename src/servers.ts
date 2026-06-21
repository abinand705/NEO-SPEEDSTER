/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ServerConfig } from './types';

export const SERVERS: ServerConfig[] = [
  {
    id: 'cloudflare-anycast',
    name: 'Cloudflare Edge',
    location: 'Nearest Anycast Edge',
    sponsor: 'Cloudflare, Inc.',
    host: 'cdnjs.cloudflare.com',
    pingUrl: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js',
    downloadUrl: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', // ~150KB small chunk
    uploadUrl: 'https://httpbin.org/post'
  },
  {
    id: 'google-dns-nyc',
    name: 'Google Cloud Engine',
    location: 'North America East (NY)',
    sponsor: 'Google LLC',
    host: 'dns.google',
    pingUrl: 'https://dns.google/resolve?name=google.com',
    downloadUrl: 'https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js',
    uploadUrl: 'https://httpbin.org/post'
  },
  {
    id: 'js-delivr-tok',
    name: 'jsDelivr Tokyo Edge',
    location: 'Asia Pacific (Tokyo)',
    sponsor: 'jsDelivr Anycast',
    host: 'cdn.jsdelivr.net',
    pingUrl: 'https://cdn.jsdelivr.net/npm/jquery@3.7.1/package.json',
    downloadUrl: 'https://cdn.jsdelivr.net/npm/three@0.141.0/build/three.min.js', // ~600KB
    uploadUrl: 'https://httpbin.org/post'
  },
  {
    id: 'un-pkg-lon',
    name: 'unpkg London Edge',
    location: 'Europe West (London)',
    sponsor: 'unpkg Inc.',
    host: 'unpkg.com',
    pingUrl: 'https://unpkg.com/react@19.0.0/package.json',
    downloadUrl: 'https://unpkg.com/three@0.141.0/build/three.min.js',
    uploadUrl: 'https://httpbin.org/post'
  }
];

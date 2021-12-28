import Vue from 'vue';
import wrap from '@vue/web-component-wrapper';

import RawVolume from './components/RawVolume';

window.customElements.define('raw-volume', wrap(Vue, RawVolume));

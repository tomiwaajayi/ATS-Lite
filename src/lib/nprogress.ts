import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// tweak style: thinner & quick
NProgress.configure({ showSpinner: false, speed: 300, trickleSpeed: 150 });

export default NProgress;

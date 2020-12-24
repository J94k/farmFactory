<?php
/**
Plugin Name: Farm Factory
Description: Stake farming contract
Author:  Denis Kaiser
Requires PHP: 7.1
Text Domain: farm
Domain Path: /lang
Version: 1.0.1
 */
/* Define Plugin Constants */
defined( 'ABSPATH' ) || exit;
define( 'DEFINANCE_TEMPLATE_DIR', __DIR__ . '/templates' );
define( 'DEFINANCE_BASE_DIR', __DIR__ );
define( 'DEFINANCE_BASE_FILE', __FILE__ );
define( 'DEFINANCE_VER', '1.0.1' );
/**
 * Plugin Init
 */

/**
 * Never worry about cache again!
 */
function my_load_scripts($hook) {
 
    // create my own version codes
    $my_js_ver  = date("ymd-Gis", filemtime( plugin_dir_path( __FILE__ ) . 'src/build/app.js' ));
    $my_css_ver  = date("ymd-Gis", filemtime( plugin_dir_path( __FILE__ ) . 'src/build/style.css' )); 
  
    wp_enqueue_script( 'custom_js', plugins_url( 'src/build/app.js', __FILE__ ), array(), $my_js_ver );
    wp_register_style( 'my_css',    plugins_url( 'src/build/style.css',    __FILE__ ), false,   $my_css_ver );
    wp_enqueue_style ( 'my_css' );
 
}
add_action('wp_enqueue_scripts', 'farm_load_scripts');

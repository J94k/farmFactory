<?php
/**
 * Enqueue Scripts
 *
 * @package Farm Factory
 */

/**
 * Never worry about cache again!
 */
function farmfactory_load_scripts() {
	// create my own version codes.
  $my_js_ver  = gmdate( 'ymd-Gis', filemtime( FARMFACTORY_PATH . 'reactwidget/static/js/main.js' ) );
  $my_css_ver = gmdate( 'ymd-Gis', filemtime( FARMFACTORY_PATH . 'assets/css/farmfactory.css' ) );

  wp_enqueue_script( 'farmfactory-js', FARMFACTORY_URL . 'reactwidget/static/js/main.js', array(), $my_js_ver, true );
  wp_enqueue_script( 'token-price', FARMFACTORY_URL . 'assets/js/token-price.js', array(), '1.0.0', true);
  wp_enqueue_style( 'farmfactory-css', FARMFACTORY_URL . 'assets/css/farmfactory.css', false, $my_css_ver );
  wp_enqueue_style( 'rainbow-css', FARMFACTORY_URL . 'reactwidget/rainbow.css', false, $my_css_ver );
}
add_action('wp_enqueue_scripts', 'farmfactory_load_scripts');

/**
 * Admin Enqueue Scripts
 *
 * @param string $hook Current page.
 */
function farmfactory_admin_scripts( $hook ) {

	global $typenow;

	if ( 'post-new.php' === $hook || 'post.php' === $hook || 'toplevel_page_FARMFACTORY' === $hook ) {
		if ( 'toplevel_page_FARMFACTORY' === $hook || 'farmfactory' === $typenow ) {

			wp_enqueue_style( 'farmfactory-admin', FARMFACTORY_URL . 'assets/css/farmfactory-admin.css', false, FARMFACTORY_VER );

			$ver = wp_rand( 1, 2222222 );

			wp_enqueue_script( 'farmfactory-deployer', FARMFACTORY_URL . 'lib/farmdeployer.js', array(), $ver, true );

			wp_enqueue_script( 'farmfactory-admin', FARMFACTORY_URL . 'assets/js/farmfactory-admin.js', array( 'farmfactory-deployer' ), $ver, true );

			$post_type_object = get_post_type_object( $typenow );

			/* Translatable string */
			wp_localize_script('farmfactory-admin', 'farmfactory',
				array(
					'l18n' => array(
						'featuredImage'       => esc_html__( 'Staking Token Icon', 'farmfactory' ),
						'setFeaturedImage'    => $post_type_object->labels->set_featured_image,
						'removeFeaturedImage' => $post_type_object->labels->remove_featured_image,
						'clickTheImage'       => esc_html__( 'Click the image to edit or update', 'farmfactory' ),
					),
				)
			);

		}
	}

}
add_action( 'admin_enqueue_scripts', 'farmfactory_admin_scripts' );

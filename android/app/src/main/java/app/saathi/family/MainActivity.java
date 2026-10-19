package app.saathi.family;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
  private long lastBack;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getOnBackPressedDispatcher()
        .addCallback(
            this,
            new OnBackPressedCallback(true) {
              @Override
              public void handleOnBackPressed() {
                WebView web = getBridge().getWebView();
                String raw = web.getUrl() == null ? "" : web.getUrl();
                String path = Uri.parse(raw).getPath();
                boolean today = path != null && path.matches("/d/[^/]+/?");
                if (web.canGoBack() && !today) {
                  web.goBack();
                  return;
                }
                long now = System.currentTimeMillis();
                if (now - lastBack < 2000) {
                  finish();
                } else {
                  lastBack = now;
                  Toast.makeText(
                          MainActivity.this,
                          "Press back again to leave · वापस दबाने से ऐप बंद होगा",
                          Toast.LENGTH_SHORT)
                      .show();
                }
              }
            });
  }

  @Override
  public void onStart() {
    super.onStart();
    getBridge()
        .getWebView()
        .setWebViewClient(
            new BridgeWebViewClient(getBridge()) {
              @Override
              public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme() == null ? "" : uri.getScheme();
                if ("tel".equals(scheme)) {
                  startActivity(new Intent(Intent.ACTION_DIAL, uri));
                  return true;
                }
                String allowed = Uri.parse(getBridge().getServerUrl()).getHost();
                String host = uri.getHost();
                if (("http".equals(scheme) || "https".equals(scheme))
                    && host != null
                    && host.equalsIgnoreCase(allowed)) {
                  return false;
                }
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
                return true;
              }

              @Override
              public void onReceivedError(
                  WebView view, WebResourceRequest request, WebResourceError error) {
                if (request != null && request.isForMainFrame()) {
                  String server = getBridge().getServerUrl();
                  view.loadUrl(
                      "file:///android_asset/public/offline.html#"
                          + Uri.encode(server == null ? "" : server));
                }
              }
            });
  }
}

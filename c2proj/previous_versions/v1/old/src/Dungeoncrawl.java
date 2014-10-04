/*
 * 1.0 code.
 */

import java.applet.Applet;
import java.awt.Graphics;

public class Dungeoncrawl extends Applet
	{
    public void init() { }
    public void start()
		{
		// main game loop
		while (1)
			{
			// do loop... timer?  callback?
			}
		}
    public void stop() { }
    public void destroy() { }

    public void paint(Graphics g)
		{
		//Draw a Rectangle around the applet's display area.
        g.drawRect(0, 0, size().width - 1, size().height - 1);
		}
	}
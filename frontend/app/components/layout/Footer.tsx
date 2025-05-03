import { Box, Typography, Container, Grid, Link, Divider } from "@mui/material";
import { Facebook, Twitter, Instagram, YouTube } from "@mui/icons-material";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{ bgcolor: "primary.main", color: "white", py: 6, mt: "auto" }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid>
            <Typography variant="h6" gutterBottom>
              Project Cinema
            </Typography>
            <Typography variant="body2">
              The ultimate destination for movie lovers. Book your tickets
              online and enjoy the latest blockbusters in comfort.
            </Typography>
            <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
              <Link href="#" color="inherit" aria-label="Facebook">
                <Facebook />
              </Link>
              <Link href="#" color="inherit" aria-label="Twitter">
                <Twitter />
              </Link>
              <Link href="#" color="inherit" aria-label="Instagram">
                <Instagram />
              </Link>
              <Link href="#" color="inherit" aria-label="YouTube">
                <YouTube />
              </Link>
            </Box>
          </Grid>
          <Grid>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Link href="/" color="inherit" display="block" sx={{ mb: 1 }}>
              Home
            </Link>
            <Link href="/movies" color="inherit" display="block" sx={{ mb: 1 }}>
              Now Showing
            </Link>
            <Link
              href="/coming-soon"
              color="inherit"
              display="block"
              sx={{ mb: 1 }}
            >
              Coming Soon
            </Link>
            <Link
              href="/cinemas"
              color="inherit"
              display="block"
              sx={{ mb: 1 }}
            >
              Cinemas
            </Link>
            <Link href="/promotions" color="inherit" display="block">
              Promotions
            </Link>
          </Grid>
          <Grid>
            <Typography variant="h6" gutterBottom>
              Help & Info
            </Typography>
            <Link href="/about" color="inherit" display="block" sx={{ mb: 1 }}>
              About Us
            </Link>
            <Link
              href="/contact"
              color="inherit"
              display="block"
              sx={{ mb: 1 }}
            >
              Contact Us
            </Link>
            <Link href="/faq" color="inherit" display="block" sx={{ mb: 1 }}>
              FAQ
            </Link>
            <Link href="/terms" color="inherit" display="block" sx={{ mb: 1 }}>
              Terms & Conditions
            </Link>
            <Link href="/privacy" color="inherit" display="block">
              Privacy Policy
            </Link>
          </Grid>
        </Grid>
        <Divider sx={{ my: 3, bgcolor: "rgba(255, 255, 255, 0.2)" }} />
        <Typography variant="body2" align="center">
          © {currentYear} Project Cinema. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
